const OpenAI = require("openai")
const { handleCommand } = require("../commands/index")
const { isOnCooldown, getRemainingCooldown, setCooldown } = require("../utils/cooldown")
const { getHistory, addMessage, upsertProfile } = require("../utils/memory")
const { simulateTyping } = require("../utils/typing")
const { SYSTEM_PROMPT } = require("../utils/prompt")

const ai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

async function onMessageCreate(message, client) {
  // Ignore bot messages
  if (message.author.bot) return

  // Cek apakah bot di-mention
  const isMentioned = message.mentions.has(client.user)
  if (!isMentioned) return

  const userId = message.author.id
  const username = message.author.globalName || message.author.username

  // Bersihin mention dari pesan
  const prompt = message.content
    .replace(/<@!?[0-9]+>/g, "")
    .trim()

  // Kalau kosong
  if (!prompt) {
    return message.reply(`Halo ${username}! Mau ngobrol apa nih? Jangan cuma mention doang, gua bukan pajangan 😂`)
  }

  // ⏱️ Cek cooldown anti-spam
  if (isOnCooldown(userId)) {
    const sisa = getRemainingCooldown(userId)
    return message.reply(
      `Santai ${username}, jangan spam dong 😭 Tunggu ${sisa} detik lagi ya, gua lagi proses yang sebelumnya.`
    )
  }

  // 🎮 Cek apakah ini command (help, ping, about, forget)
  const isCommand = await handleCommand(prompt, message, client)
  if (isCommand) return

  // Set cooldown sebelum proses AI
  setCooldown(userId)

  // Update profil user
  const profile = upsertProfile(userId, username)

  // Tambah pesan ke memory
  addMessage(userId, "user", `[${username}]: ${prompt}`)
  const history = getHistory(userId)

  try {
    // Build system prompt dengan info user
    const personalizedSystem = `
${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT USER SEKARANG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nama: ${username}
- Total pesan ke bot: ${profile.messageCount}
- Pertama kali ngobrol: ${new Date(profile.firstSeen).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
${profile.messageCount === 1 ? "- Ini percakapan PERTAMA mereka sama kamu. Kasih sapaan awal yang asik!" : "- Mereka udah pernah ngobrol sama kamu sebelumnya. Jangan kasih sapaan awal pirate lagi."}
    `.trim()

    // Kirimin dulu request ke AI buat tau panjang responnya
    const completion = await ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.92,
      max_tokens: 512,
      messages: [
        { role: "system", content: personalizedSystem },
        // Kirim history tapi skip pesan terakhir (yang baru aja ditambahin)
        ...history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: `[${username}]: ${prompt}` }
      ]
    })

    let reply = completion.choices[0].message.content

    // Simulate natural typing delay berdasarkan panjang reply
    await simulateTyping(message.channel, reply)

    // Trim kalau kelewat panjang (Discord limit 2000 char)
    if (reply.length > 2000) {
      reply = reply.slice(0, 1990) + "..."
    }

    // Simpan reply ke memory
    addMessage(userId, "assistant", reply)

    // Kirim!
    await message.reply(reply)

  } catch (error) {
    console.error(`[AI Error] User: ${username} | Prompt: ${prompt}`)
    console.error(error)

    await message.reply(`Aduh ${username}, otak AI gua lagi ngambek nih 💀 Coba lagi bentar ya.`)
  }
}

module.exports = { onMessageCreate }