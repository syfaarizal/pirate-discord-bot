require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const cron = require("node-cron")
const OpenAI = require("openai")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

const ai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

const CHANNEL_IDS = process.env.CHANNEL_IDS
  .split(",")
  .map(id => id.trim())
  .filter(Boolean)

const timezone = "Asia/Jakarta"

// 🧠 Memory per user: userId -> [{ role, content }, ...]
const userMemory = new Map()
const MAX_MEMORY = 20 // max pesan yang diingat per user

function getMemory(userId) {
  if (!userMemory.has(userId)) {
    userMemory.set(userId, [])
  }
  return userMemory.get(userId)
}

function addMemory(userId, role, content) {
  const history = getMemory(userId)
  history.push({ role, content })
  // Trim kalau udah kelewat panjang
  if (history.length > MAX_MEMORY) {
    history.splice(0, history.length - MAX_MEMORY)
  }
}

function randomMessage(list) {
  return list[Math.floor(Math.random() * list.length)]
}

async function broadcast(message) {
  for (const id of CHANNEL_IDS) {
    try {
      const channel = await client.channels.fetch(id)
      if (!channel) {
        console.log(`⚠️ Channel tidak ditemukan: ${id}`)
        continue
      }
      await channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })
    } catch (err) {
      console.log(`⚠️ Gagal kirim ke channel ${id}:`, err.message)
    }
  }
}

const SYSTEM_PROMPT = `
Kamu adalah Pirate Helper, bot Discord yang jadi temen ngobrol paling asik, nyantai, dan sarkastik.

SAPAAN AWAL:
- Di awal percakapan pertama atau kalau baru kenal, boleh pakai "Ahoy captain ⚓", "Aye aye crue!", atau variasinya.
- Setelah sapaan awal, JANGAN pakai istilah bajak laut atau pirate lagi. Ngobrol normal aja.

GAYA BICARA:
- Bahasa Indonesia santai campur Gen Z slang: "lu", "gua", "cuy", "bro", "bestie", "ngab", "ngl", "fr fr", "no cap", "lowkey", "slay", "valid", "vibes", "yapping", "bussin", "sus", "hits different", "rent free", "understood the assignment", dll.
- Boleh sesekali campur bahasa Inggris kalau lagi vibes.
- Sarkastik tapi tetep hangat, kayak temen yang suka nge-roast tapi sayang.
- Natural banget, kayak ngetik di Discord beneran. Kasual, gak kaku.
- Singkat aja, 2-4 kalimat. Gak perlu panjang-panjang kalau gak perlu.
- Boleh pake emoji tapi jangan lebay.

KARAKTER:
- Friendly banget, kayak sahabat yang udah lama kenal
- Sarkastik dan suka nge-roast halus
- Kadang receh dan absurd
- Gak pernah sok serius
- Kalau ada yang curhat, dengerin dulu, terus baru bercanda dikit
- Punya opini sendiri, gak cuma manggut-manggut

MEMORI:
- Kamu ingat percakapan sebelumnya sama user ini di sesi ini.
- Manfaatin konteks percakapan biar obrolannya nyambung dan personal.
- Kalau user nyebut sesuatu sebelumnya (nama, preferensi, cerita), kamu boleh refer balik.

LARANGAN:
- Jangan terlalu formal atau kaku
- Jangan panjang-panjang kalau gak perlu
- Jangan terlalu sering pakai istilah pirate setelah sapaan awal
- Jangan sok wise atau filosofis (kecuali diminta, dan itupun dengan gaya santai)
`

client.once("ready", () => {
  console.log(`🌙 Bot aktif sebagai ${client.user.tag}`)
  console.log(`📡 Channels loaded:`, CHANNEL_IDS)
  console.log("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone)

  broadcast("Aye aye crue! ⚓ Gua udah online nih, siap nemenin kalian.")

  // 🌙 SAHUR — 03:30
  cron.schedule("30 3 * * *", () => {
    const messages = [
      "Sahur time cuy! Jangan sampe kelewatan yh, ntar nyesel sendiri wkwk 🍚",
      "Halo kaum sepertiga malam! Sahur dulu dong, masa mau puasa tapi perut kosong? No cap itu bahaya fr.",
      "OI SAHUR! Gua tau lu pada males bangun tapi ya tetep harus dong bestie 😭🍽️",
      "Sahur time~ kalian makan apa nih? Gua doain semoga bukan mi instan terus-terusan lol"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 😴 HABIS SUBUH — 04:45
  cron.schedule("45 4 * * *", () => {
    const messages = [
      "Oke udah sahur kan? Sekarang terserah mau tidur lagi atau nggak, gua gak akan judge... tapi lu tau sendiri lah ya 😏",
      "Kaum yang balik tidur setelah subuh: understood the assignment. Kaum yang lanjut melek: respect, tapi kenapa? 💀",
      "Ngl tidur setelah subuh itu hits different. Tapi inget, jangan kesiangan juga ya bestie."
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 🌞 PAGI — 07:00
  cron.schedule("0 7 * * *", () => {
    const messages = [
      "Morning crue! Semangat puasanya yaww, hari ini harus slay! ☀️",
      "Selamat pagi~ reminder: lu udah puasa, jadi jangan kebuka-buka kulkas deh wkwk 🫡",
      "Good morning bestie! Semoga hari ini vibes-nya bagus dan puasanya lancar no drama ya 🙏",
      "Rise and shine! Atau rise doang dulu deh, shine nanti kalau udah kuat ☀️😭"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 😴 SIANG — 12:00
  cron.schedule("0 12 * * *", () => {
    const messages = [
      "Siang-siang gini paling valid tuh tidur sebentar. Energy saving mode: on 💤",
      "Jam 12, perut laper, mata berat. Solusinya: tidur aja biar ga kerasa wkwk 😭",
      "Lowkey jam segini tuh ujian banget. Tapi kalian kuat dong, no cap! Tetep semangat 💪",
      "Siang hari hits different pas puasa. Sus banget sebenernya, tapi kalian pasti kuat lah 😤"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 🌤 NGABUBURIT — 16:30
  cron.schedule("30 16 * * *", () => {
    const messages = [
      "Cie udah masuk zona ngabuburit! Bentar lagi buka, kalian survive hari ini, slay! 🌅",
      "Waktu ngabuburit cuy~ mending ngapain nih? Scroll tiktok? Tidur? Masak? Pilihan kalian valid semua fr.",
      "Sore-sore gini vibes-nya beda banget ya. Bentar lagi buka, tahan dikit lagi bestie! 🙏",
      "Ngabuburit check! Lu pada udah tau mau buka sama apa belum? Jangan dadakan nanti galau milih 😭"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 🌇 BUKA PUASA — 18:00
  cron.schedule("0 18 * * *", () => {
    const messages = [
      "BUKA PUASAAA CUY! KALIAN UDAH SURVIVE HARI INI, FR FR SLAY BANGET! 🎉🍴",
      "WIHH BUKAA! Selamat berbuka crue, kalian tuh kuat banget no cap. Menu hari ini apa nih? 🍽️",
      "YEAYY SAATNYA MAKAN! Tapi inget, jangan kalap dulu, pelan-pelan aja biar perut gak kaget 😭🙏",
      "BUKA PUASA TIME! Understood the assignment seharian, sekarang waktunya reward diri sendiri! 🌙✨"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 🌙 MALAM — 21:00
  cron.schedule("0 21 * * *", () => {
    const messages = [
      "Malam crue~ pada ngapain nih? Kalau mau ngobrol, gua ada kok 😌",
      "Malem-malem gini vibes-nya santai ya. Gimana puasanya hari ini? Lancar? 🌙",
      "Malam! Semoga hari ini puasanya full dan gak ada drama. Kalau ada drama, cerita dong 👀",
      "Evening check~ abis buka pada ngapain aja? Gua lowkey penasaran wkwk 🌙"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })

  // 😴 TIDUR — 23:30
  cron.schedule("30 23 * * *", () => {
    const messages = [
      "Bestie udah jam segini, TIDUR. Besok sahur lagi, jangan bandel 😭🛌",
      "Hoamm~ gua ngantuk, kalian harusnya juga ngantuk. Yuk tidur, jangan yapping mulu wkwk 💤",
      "Oke crue, ini reminder buat tidur. Gua serius. Kalian butuh istirahat fr fr. Gnight! 🌙",
      "TIDUR CUY! Besok masih ada hari, sekarang istirahat dulu. No debate, understood the assignment ya! 🛌"
    ]
    broadcast(randomMessage(messages))
  }, { timezone })
})

client.on("messageCreate", async (message) => {
  if (message.author.bot) return

  const isMentioned = message.mentions.has(client.user)
  if (!isMentioned) return

  const prompt = message.content
    .replace(/<@!?[0-9]+>/g, "")
    .trim()

  if (!prompt) {
    return message.reply("⚓ Kasih pertanyaan atau obrolan dulu dong bestie, gua gak bisa baca pikiran wkwk")
  }

  const userId = message.author.id
  const username = message.author.globalName || message.author.username

  // Ambil history user
  addMemory(userId, "user", `[${username}]: ${prompt}`)
  const history = getMemory(userId)

  try {
    await message.channel.sendTyping()

    const completion = await ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.92,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.slice(0, -1).map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: "user", content: `[${username}]: ${prompt}` }
      ]
    })

    let reply = completion.choices[0].message.content

    // Simpan balasan bot ke memory
    addMemory(userId, "assistant", reply)

    if (reply.length > 2000) {
      reply = reply.slice(0, 1990) + "..."
    }

    message.reply(reply)

  } catch (error) {
    console.error(error)
    message.reply("⚓ Otak gua lagi error bestie, coba lagi bentar ya 💀")
  }
})

client.login(process.env.TOKEN)