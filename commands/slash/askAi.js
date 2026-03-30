const { SlashCommandBuilder } = require("discord.js")
const OpenAI = require("openai")
const { getHistory, addMessage, upsertProfile } = require("../../utils/memory")
const { isOnCooldown, getRemainingCooldown, setCooldown } = require("../../utils/cooldown")
const { SYSTEM_PROMPT } = require("../../utils/prompt")
const {
  getConfig,
  addCustomReminder,
  addReminderText,
  setEnabled,
  BUILT_IN_KEYS,
} = require("../../utils/reminderConfig")

const ai = new OpenAI({
  apiKey:   process.env.AI_KEY,
  baseURL:  "https://openrouter.ai/api/v1",
})

// Command Definition

const data = new SlashCommandBuilder()
  .setName("ask-ai")
  .setDescription("Ngobrol sama Kichi — tanya apapun, atau minta bikinin reminder!")
  .addStringOption(opt => opt
    .setName("pesan")
    .setDescription("Apa yang mau lu tanyain atau obrolin?")
    .setRequired(true)
    .setMaxLength(1000)
  )

// Intent Detection — apakah ini request reminder?

const INTENT_SYSTEM = `
Kamu adalah parser intent untuk bot Discord bernama Kichi.
Tugasmu: analisis pesan user dan tentukan apakah mereka minta CREATE atau MODIFY sebuah reminder otomatis.

Kalau iya, ekstrak:
- action: "create_reminder" | "toggle_reminder" | "none"
- key: string ID unik (huruf kecil, tanpa spasi, pakai - kalau perlu). Derive dari label kalau tidak eksplisit.
- label: nama tampilan reminder
- hour: number (0-23)
- minute: number (0-59)
- emoji: emoji yang cocok dengan tema reminder (opsional, default 🔔)
- messages: array string (1-3 contoh teks pesan reminder, dalam Bahasa Indonesia santai Gen Z)
- enabled: boolean (kalau action toggle)

PENTING:
- Kalau tidak ada niat bikin/ubah reminder → action: "none"
- Untuk built-in keys (pagi, siang, malam) → action bisa "toggle_reminder"
- Generate pesan yang sesuai gaya bot: santai, Gen Z, Bahasa Indonesia, bisa campur sedikit English

Balas HANYA dengan JSON valid. Tidak ada teks lain. Tidak ada markdown backtick.
`.trim()

async function detectReminderIntent(userMessage) {
  try {
    const res = await ai.chat.completions.create({
      model:       "openai/gpt-4o-mini",
      temperature: 0.2,
      max_tokens:  400,
      messages: [
        { role: "system",  content: INTENT_SYSTEM },
        { role: "user",    content: userMessage },
      ],
    })

    const raw  = res.choices[0].message.content.trim()
    const json = JSON.parse(raw)
    return json
  } catch {
    return { action: "none" }
  }
}

// Execute Reminder Intent

async function executeReminderIntent(intent, guildId) {
  const { action, key, label, hour, minute, emoji, messages, enabled } = intent

  // Validasi dasar
  if (!key || typeof hour !== "number" || typeof minute !== "number") {
    return { ok: false, reason: "Data reminder gak lengkap." }
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { ok: false, reason: `Jam \`${hour}:${minute}\` gak valid.` }
  }

  if (action === "create_reminder") {
    if (BUILT_IN_KEYS.includes(key)) {
      return { ok: false, reason: `\`${key}\` adalah reminder bawaan. Kasih nama lain.` }
    }

    const ok = addCustomReminder(guildId, key, {
      label:  label || key,
      emoji:  emoji || "🔔",
      hour,
      minute,
    })

    if (!ok) {
      return { ok: false, reason: `Reminder \`${key}\` udah ada.` }
    }

    // Tambah pesan kalau ada
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages.slice(0, 5)) {
        addReminderText(guildId, key, msg)
      }
    }

    return {
      ok: true,
      key,
      label:  label || key,
      emoji:  emoji || "🔔",
      hour,
      minute,
      msgCount: (messages || []).length,
    }
  }

  if (action === "toggle_reminder") {
    const state = typeof enabled === "boolean" ? enabled : true
    setEnabled(guildId, key, state)
    return { ok: true, toggled: true, key, enabled: state }
  }

  return { ok: false, reason: "action tidak dikenali" }
}

// Format jam helper

function fmt(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// Main Execute

async function execute(interaction) {
  const userId   = interaction.user.id
  const username = interaction.user.globalName || interaction.user.username
  const prompt   = interaction.options.getString("pesan")

  // Cooldown check
  if (isOnCooldown(userId)) {
    const sisa = getRemainingCooldown(userId)
    return interaction.reply({
      content: `Santai ${username}, jangan spam dong 😭 Tunggu ${sisa} detik lagi ya.`,
      ephemeral: true,
    })
  }

  setCooldown(userId)
  await interaction.deferReply()

  const profile = upsertProfile(userId, username)
  addMessage(userId, "user", `[${username}]: ${prompt}`)
  const history = getHistory(userId)

  // ── Cek apakah ada intent reminder ──
  const guildId = interaction.guildId
  if (guildId) {
    const intent = await detectReminderIntent(prompt)

    if (intent.action === "create_reminder") {
      // Cek permission
      const member = interaction.member
      const isAdmin = member && (
        member.guild.ownerId === member.id ||
        member.permissions.has(0x8n) || // ADMINISTRATOR
        member.permissions.has(0x20n)   // MANAGE_GUILD
      )

      if (!isAdmin) {
        const reply = `eh ${username}, gua nangkep lu minta bikinin reminder — tapi yang bisa bikin reminder itu Admin/Mod aja ya, bukan gua sendiri yang bisa bypass 😅`
        addMessage(userId, "assistant", reply)
        return interaction.editReply(reply)
      }

      const result = await executeReminderIntent(intent, guildId)

      if (result.ok && !result.toggled) {
        const reply = [
          `${result.emoji} oke ${username}, reminder **${result.label}** (\`${result.key}\`) udah gua bikin!`,
          `⏰ jam \`${fmt(result.hour, result.minute)}\` WIB, status ✅ ON`,
          result.msgCount > 0
            ? `📝 ${result.msgCount} teks pesan udah gua tambahin juga.`
            : `_btw belum ada teks pesan — tambahin lewat \`/reminder edit\` ya biar bisa kekirim._`,
        ].join("\n")

        addMessage(userId, "assistant", reply)
        return interaction.editReply(reply)
      }

      if (result.ok && result.toggled) {
        const reply = result.enabled
          ? `oke ${username}, reminder \`${result.key}\` udah gua nyalain ✅`
          : `sip ${username}, reminder \`${result.key}\` udah gua matiin ❌`
        addMessage(userId, "assistant", reply)
        return interaction.editReply(reply)
      }

      // Kalau gagal, fall through ke AI chat biasa dengan context error
    }
  }

  // ── Normal AI Chat ──
  const personalizedSystem = `
${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT USER SEKARANG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nama: ${username}
- Total pesan ke bot: ${profile.messageCount}
- Pertama ngobrol: ${new Date(profile.firstSeen).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
${profile.messageCount === 1
  ? "- Ini percakapan PERTAMA mereka. Kasih sapaan awal yang asik!"
  : "- Udah pernah ngobrol sebelumnya. Jangan sapaan pirate lagi."}

KEMAMPUAN TAMBAHAN (sebut kalau relevan):
- Lu bisa bikin reminder otomatis kalau user minta, contoh: "kichi bikinin reminder tiap jam 9 malam"
- Cukup tulis natural aja, lu yang auto-parse-nya
`.trim()

  try {
    const completion = await ai.chat.completions.create({
      model:       "openai/gpt-4o-mini",
      temperature: 0.92,
      max_tokens:  512,
      messages: [
        { role: "system", content: personalizedSystem },
        ...history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: "user",   content: `[${username}]: ${prompt}` },
      ],
    })

    let reply = completion.choices[0].message.content
    addMessage(userId, "assistant", reply)
    if (reply.length > 2000) reply = reply.slice(0, 1990) + "..."

    return interaction.editReply(reply)

  } catch (err) {
    console.error(`[AI Error] ${username}: ${prompt}`, err)
    return interaction.editReply(`Aduh ${username}, otak AI gua lagi ngambek 💀 Coba lagi bentar ya.`)
  }
}

module.exports = { data, execute }