const { SlashCommandBuilder } = require("discord.js")
const OpenAI = require("openai")
const { getHistory, addMessage, upsertProfile } = require("../../utils/memory")
const { isOnCooldown, getRemainingCooldown, setCooldown } = require("../../utils/cooldown")
const { SYSTEM_PROMPT } = require("../../utils/prompt")

const ai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

const data = new SlashCommandBuilder()
  .setName("ask-ai")
  .setDescription("Ngobrol sama Pirate Helper — tanya apapun!")
  .addStringOption(opt => opt
    .setName("pesan")
    .setDescription("Apa yang mau lu tanyain atau obrolin?")
    .setRequired(true)
    .setMaxLength(1000)
  )

async function execute(interaction) {
  const userId   = interaction.user.id
  const username = interaction.user.globalName || interaction.user.username
  const prompt   = interaction.options.getString("pesan")

  // ⏱️ Cooldown check
  if (isOnCooldown(userId)) {
    const sisa = getRemainingCooldown(userId)
    return interaction.reply({
      content: `Santai ${username}, jangan spam dong 😭 Tunggu ${sisa} detik lagi ya.`,
      ephemeral: true
    })
  }

  setCooldown(userId)
  await interaction.deferReply()

  const profile = upsertProfile(userId, username)
  addMessage(userId, "user", `[${username}]: ${prompt}`)
  const history = getHistory(userId)

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
  `.trim()

  try {
    const completion = await ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.92,
      max_tokens: 512,
      messages: [
        { role: "system", content: personalizedSystem },
        ...history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: `[${username}]: ${prompt}` }
      ]
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