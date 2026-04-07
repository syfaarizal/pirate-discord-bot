const { getHistory, addMessage, upsertProfile } = require("../utils/memory")
const { isOnCooldown, getRemainingCooldown, setCooldown } = require("../utils/cooldown")
const { SYSTEM_PROMPT } = require("../utils/prompt")
const { simulateTyping } = require("../utils/typing")
const OpenAI = require("openai")

const ai = new OpenAI({
  apiKey:  process.env.AI_KEY,
  baseURL: "https://openrouter.ai/api/v1",
})

function fmt(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

async function onMessageCreate(message) {
  // Ignore bot messages
  if (message.author.bot) return

  const client    = message.client
  const isMention = message.mentions.has(client.user)
  const isReply   = message.reference?.messageId != null

  // Cek apakah ini reply ke pesan bot
  let isReplyToBot = false
  let repliedMessage = null

  if (isReply) {
    try {
      repliedMessage = await message.channel.messages.fetch(message.reference.messageId)
      isReplyToBot   = repliedMessage?.author?.id === client.user.id
    } catch {
      // Pesan yang di-reply udah dihapus atau gak bisa di-fetch — skip
    }
  }

  if (!isMention && !isReplyToBot) return

  // Bersihkan mention dari pesan
  const cleanContent = message.content
    .replace(/<@!?\d+>/g, "")
    .trim()

  if (!cleanContent) {
    return message.reply("hm? lu nge-tag gua tapi gak ngomong apa-apa 😭")
  }

  const userId   = message.author.id
  const username = message.member?.displayName || message.author.globalName || message.author.username

  // Cooldown check
  if (isOnCooldown(userId)) {
    const sisa = getRemainingCooldown(userId)
    return message.reply(`santai ${username}, tunggu ${sisa} detik lagi ya 😭`)
  }

  setCooldown(userId)

  let userPrompt = cleanContent
  if (isReplyToBot && repliedMessage) {
    const repliedContent = repliedMessage.content.slice(0, 300)
    userPrompt = `[Konteks — lu barusan bilang: "${repliedContent}"]\n\n${cleanContent}`
  }

  const profile = upsertProfile(userId, username)
  addMessage(userId, "user", `[${username}]: ${userPrompt}`)
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

  // Typing indicator
  await simulateTyping(message.channel, "...")

  try {
    const completion = await ai.chat.completions.create({
      model:       "openai/gpt-4o-mini",
      temperature: 0.92,
      max_tokens:  512,
      messages: [
        { role: "system", content: personalizedSystem },
        ...history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: "user",   content: `[${username}]: ${userPrompt}` },
      ],
    })

    let reply = completion.choices[0].message.content
    addMessage(userId, "assistant", reply)
    if (reply.length > 2000) reply = reply.slice(0, 1990) + "..."

    return message.reply(reply)

  } catch (err) {
    console.error(`[MessageCreate AI Error] ${username}:`, err)
    return message.reply(`aduh, otak gua lagi error 💀 coba lagi bentar ya ${username}.`)
  }
}

module.exports = { onMessageCreate }