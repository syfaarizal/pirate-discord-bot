const {
    SlashCommandBuilder,
    PermissionFlagsBits,
  } = require("discord.js")
  const {
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    EndBehaviorType,
  } = require("@discordjs/voice")
  const { Pipeline }  = require("node:stream")
  const { Readable }  = require("stream")
  const fs            = require("fs")
  const path          = require("path")
  const os            = require("os")
  const OpenAI        = require("openai")
  
  const { getCaller }                          = require("../../utils/vcState")
  const { textToSpeech, cleanupTempFile }      = require("../../utils/tts")
  const { transcribe }                         = require("../../utils/stt")
  const {
    setListening, isListening,
    setKeyword, getKeyword,
    setSpeaking, isSpeaking,
    setAbort, getAbort, clearAbort, clearSession,
  } = require("../../utils/voiceSession")
  const { getHistory, addMessage, upsertProfile } = require("../../utils/memory")
  const { SYSTEM_PROMPT }                      = require("../../utils/prompt")
  
  const ai = new OpenAI({
    apiKey:  process.env.AI_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  })
  
  // ─────────────────────────────────────────────
  // Command definitions
  // ─────────────────────────────────────────────
  
  const speakData = new SlashCommandBuilder()
    .setName("speak")
    .setDescription("Kichi ngomong sesuatu di VC")
    .addStringOption(opt => opt
      .setName("pesan")
      .setDescription("Teks yang mau diucapin Kichi")
      .setRequired(true)
      .setMaxLength(500)
    )
  
  const listenData = new SlashCommandBuilder()
    .setName("listen")
    .setDescription("Toggle mode dengerin Kichi di VC (on/off)")
    .addStringOption(opt => opt
      .setName("mode")
      .setDescription("on atau off")
      .setRequired(true)
      .addChoices(
        { name: "on",  value: "on"  },
        { name: "off", value: "off" },
      )
    )
  
  const setkeywordData = new SlashCommandBuilder()
    .setName("setkeyword")
    .setDescription("Ganti keyword trigger Kichi (default: 'kichi')")
    .addStringOption(opt => opt
      .setName("keyword")
      .setDescription("Keyword yang diucapin caller buat manggil Kichi")
      .setRequired(true)
      .setMaxLength(20)
    )
  
  // ─────────────────────────────────────────────
  // Core: play audio di VC
  // ─────────────────────────────────────────────
  
  async function playAudio(connection, filePath) {
    return new Promise((resolve, reject) => {
      const player   = createAudioPlayer()
      const resource = createAudioResource(filePath)
  
      connection.subscribe(player)
      player.play(resource)
  
      player.on(AudioPlayerStatus.Idle, () => resolve())
      player.on("error", err => reject(err))
  
      // Timeout safety — max 30 detik per utterance
      setTimeout(() => resolve(), 30_000)
    })
  }
  
  // ─────────────────────────────────────────────
  // Core: TTS + play
  // ─────────────────────────────────────────────
  
  async function speak(connection, guildId, text) {
    setSpeaking(guildId, true)
    let tmpFile = null
    try {
      tmpFile = await textToSpeech(text)
      await playAudio(connection, tmpFile)
    } finally {
      setSpeaking(guildId, false)
      if (tmpFile) cleanupTempFile(tmpFile)
    }
  }
  
  // ─────────────────────────────────────────────
  // Core: record audio dari satu user, return PCM buffer
  // ─────────────────────────────────────────────
  
  function recordUser(receiver, userId, durationMs = 4000) {
    return new Promise(resolve => {
      const chunks = []
  
      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 500,  // stop setelah 500ms silence
        },
      })
  
      const timeout = setTimeout(() => {
        audioStream.destroy()
        resolve(Buffer.concat(chunks))
      }, durationMs)
  
      audioStream.on("data", chunk => chunks.push(chunk))
  
      audioStream.on("end", () => {
        clearTimeout(timeout)
        resolve(Buffer.concat(chunks))
      })
  
      audioStream.on("error", () => {
        clearTimeout(timeout)
        resolve(Buffer.concat(chunks))
      })
    })
  }
  
  // ─────────────────────────────────────────────
  // Core: AI response (teks)
  // ─────────────────────────────────────────────
  
  async function getAIResponse(userId, username, userMessage) {
    const profile = upsertProfile(userId, username)
    addMessage(userId, "user", `[${username}]: ${userMessage}`)
    const history = getHistory(userId)
  
    const systemPrompt = `
  ${SYSTEM_PROMPT}
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONTEXT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Nama: ${username}
  - Lu lagi di voice channel, jawab PENDEK dan NATURAL — maks 2 kalimat.
  - Gak perlu bullet point atau markdown. Cukup ngomong natural.
  - Jangan sebut "sebagai AI" atau hal teknis.
  `.trim()
  
    const completion = await ai.chat.completions.create({
      model:       "openai/gpt-4o-mini",
      temperature: 0.85,
      max_tokens:  120,  // pendek buat voice
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: `[${username}]: ${userMessage}` },
      ],
    })
  
    const reply = completion.choices[0].message.content.trim()
    addMessage(userId, "assistant", reply)
    return reply
  }
  
  // ─────────────────────────────────────────────
  // Listen loop — jalan selama listen mode ON
  // ─────────────────────────────────────────────
  
  async function startListenLoop(guildId, connection, callerId, callerUsername) {
    const abortCtrl = new AbortController()
    setAbort(guildId, abortCtrl)
  
    console.log(`👂 [Listen] Loop start — guild ${guildId}, caller ${callerUsername}`)
  
    while (isListening(guildId) && !abortCtrl.signal.aborted) {
      // Kalau bot lagi ngomong, tunggu dulu
      if (isSpeaking(guildId)) {
        await sleep(200)
        continue
      }
  
      // Validasi connection masih hidup
      const conn = getVoiceConnection(guildId)
      if (!conn) break
  
      // Pastiin receiver ada
      const receiver = conn.receiver
      if (!receiver) { await sleep(500); continue }
  
      try {
        // Record audio caller selama maks 5 detik
        const pcmBuffer = await recordUser(receiver, callerId, 5000)
        if (!pcmBuffer || pcmBuffer.length < 2000) { await sleep(100); continue }
  
        // Transcribe
        const transcript = await transcribe(pcmBuffer)
        if (!transcript) { await sleep(100); continue }
  
        console.log(`🎤 [STT] ${callerUsername}: "${transcript}"`)
  
        const keyword = getKeyword(guildId)
  
        // Cek apakah ada keyword
        if (!transcript.includes(keyword)) { await sleep(100); continue }
  
        // Keyword ketemu — ambil bagian setelah keyword sebagai pesan
        const afterKeyword = transcript.split(keyword).slice(1).join(keyword).trim()
        const userMessage   = afterKeyword || "hei"
  
        console.log(`💬 [Listen] Keyword detected: "${userMessage}"`)
  
        // Generate AI response
        const aiReply = await getAIResponse(callerId, callerUsername, userMessage)
        console.log(`🤖 [AI→Voice] "${aiReply}"`)
  
        // Speak
        const activeConn = getVoiceConnection(guildId)
        if (activeConn) await speak(activeConn, guildId, aiReply)
  
      } catch (err) {
        // Jangan crash loop karena satu error
        console.error("[Listen Loop Error]", err.message)
        await sleep(500)
      }
  
      await sleep(100)
    }
  
    console.log(`🔇 [Listen] Loop stop — guild ${guildId}`)
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // ─────────────────────────────────────────────
  // /speak handler
  // ─────────────────────────────────────────────
  
  async function executeSpeak(interaction) {
    const guildId  = interaction.guildId
    const callerId = getCaller(guildId)
    const userId   = interaction.user.id
  
    // Cek bot di VC
    const connection = getVoiceConnection(guildId)
    if (!connection) {
      return interaction.reply({
        content: "gua gak di VC. `/join` dulu.",
        ephemeral: true,
      })
    }
  
    // Cek caller / admin
    const member       = interaction.member
    const isAdminOrMod = member && (
      member.guild.ownerId === userId ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild)
    )
    if (userId !== callerId && !isAdminOrMod) {
      return interaction.reply({
        content: "cuma caller atau admin yang bisa nyuruh gua ngomong.",
        ephemeral: true,
      })
    }
  
    const text = interaction.options.getString("pesan")
    await interaction.reply({ content: `🔊 ngomong di VC...`, ephemeral: true })
  
    try {
      await speak(connection, guildId, text)
    } catch (err) {
      console.error("[Speak Error]", err)
      await interaction.followUp({ content: "gagal ngomong, cek GOOGLE_TTS_KEY di .env.", ephemeral: true })
    }
  }
  
  // ─────────────────────────────────────────────
  // /listen handler
  // ─────────────────────────────────────────────
  
  async function executeListen(interaction) {
    const guildId  = interaction.guildId
    const callerId = getCaller(guildId)
    const userId   = interaction.user.id
    const mode     = interaction.options.getString("mode")
  
    // Cek bot di VC
    const connection = getVoiceConnection(guildId)
    if (!connection) {
      return interaction.reply({ content: "gua gak di VC. `/join` dulu.", ephemeral: true })
    }
  
    // Hanya caller yang bisa toggle listen
    if (userId !== callerId) {
      return interaction.reply({
        content: "cuma caller yang bisa toggle listen mode.",
        ephemeral: true,
      })
    }
  
    if (mode === "on") {
      if (isListening(guildId)) {
        return interaction.reply({ content: "gua udah dengerin dari tadi.", ephemeral: true })
      }
  
      // Ambil info caller dari guild
      const callerMember   = await interaction.guild.members.fetch(callerId).catch(() => null)
      const callerUsername = callerMember?.displayName || callerMember?.user.username || "caller"
      const keyword        = getKeyword(guildId)
  
      setListening(guildId, true)
  
      // Sapaan pertama
      try {
        await speak(connection, guildId, `Halo ${callerUsername}! Panggil aja "${keyword}" kalau mau ngobrol.`)
      } catch (err) {
        console.error("[Listen Greet Error]", err)
      }
  
      // Start loop (non-blocking)
      startListenLoop(guildId, connection, callerId, callerUsername)
  
      return interaction.reply({
        content: `👂 listen mode **ON** — panggil \`${keyword}\` di VC buat ngobrol sama gua.`,
      })
    }
  
    if (mode === "off") {
      if (!isListening(guildId)) {
        return interaction.reply({ content: "listen mode udah off.", ephemeral: true })
      }
  
      setListening(guildId, false)
      clearAbort(guildId)
      clearSession(guildId)
  
      return interaction.reply({ content: "🔇 listen mode **OFF**." })
    }
  }
  
  // ─────────────────────────────────────────────
  // /setkeyword handler
  // ─────────────────────────────────────────────
  
  async function executeSetKeyword(interaction) {
    const guildId  = interaction.guildId
    const callerId = getCaller(guildId)
    const userId   = interaction.user.id
    const keyword  = interaction.options.getString("keyword").toLowerCase().trim()
  
    const member       = interaction.member
    const isAdminOrMod = member && (
      member.guild.ownerId === userId ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild)
    )
  
    if (userId !== callerId && !isAdminOrMod) {
      return interaction.reply({
        content: "cuma caller atau admin yang bisa ganti keyword.",
        ephemeral: true,
      })
    }
  
    setKeyword(guildId, keyword)
    return interaction.reply({
      content: `✅ keyword diganti jadi \`${keyword}\`. Ucapin itu di VC buat manggil gua.`,
    })
  }
  
  // ─────────────────────────────────────────────
  // Exports
  // ─────────────────────────────────────────────
  
  module.exports = {
    speakData, listenData, setkeywordData,
    executeSpeak, executeListen, executeSetKeyword,
  }