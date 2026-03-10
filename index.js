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
      console.log(`⚠️ Gagal kirim ke channel ${id}`)
    }
  }
}

client.once("ready", () => {

  console.log(`🌙 Bot Ramadhan aktif sebagai ${client.user.tag}`)
  console.log(`📡 Channels loaded:`, CHANNEL_IDS)
  console.log("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone)

  broadcast("Udah aktif ya bot ini, bos Kai.")

  // 🌙 SAHUR
  cron.schedule("30 3 * * *", () => {

    const messages = [
      "Sahur time! Selamat sahur yh <3",
      "Helloww! Selamat sahur eperibadeh! Sahur sama apa nich?",
      "Gila banget emang yang masih bangun nih. Sekalian sahur nya janga lupa yh.",
      "SELAMAT SAHUR SEMYWAHHH"
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 😴 HABIS SUBUH
  cron.schedule("45 4 * * *", () => {

    const messages = [
      "JANGAN SEGINI ENAK NYA TIDUR LAGI SIH. eh maap, kepencet caps lock.",
      "Ni yang kaum kalong tidur dulu gak sih? Kalo iya, selamat tidur lagi ya.",
      "Nice udah sahur, waktunya recharge energi bentar sebelum mulai aktivitas."
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 🌞 PAGI
  cron.schedule("0 7 * * *", () => {

    const messages = [
      "Selamat pagi eperibodehh! Semangat puasanya yaww",
      "Morning check! Jangan lupa minum... eh, puasa ding.",
      "Hari baru, semangat baru. Semoga puasanya lancar hari ini, mainiezz <3"
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 😴 TIDUR SIANG
  cron.schedule("0 12 * * *", () => {

    const messages = [
      "Siang hari enaknya tidur bentar ga siee, biar kuat sampe buka.",
      "Udah ngapain aja hari ini? Kalo capek, tidur siang bentar boleh kok.",
      "Energy saving mode: tidur dulu ga sih daripada mokel. Eh..."
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 🌤 NGABUBURIT
  cron.schedule("30 16 * * *", () => {

    const messages = [
      "Cie yang udah pada laper wkwkwk, sabar yahh mending ngabuburit dulu sambil nunggu.",
      "Sore-sore gini enaknya ngapain ya? Ngabuburit sambil dengerin musik boleh juga.",
      "Ciee yang lagi ngabuburit, udah nemu tempat favorit belum buat nunggu buka?"
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 🌇 BUKA PUASA
  cron.schedule("0 18 * * *", () => {

    const messages = [
      "SELAMAT BERBUKA EPRIBADEHH!",
      "YEAYY BUKA PUASA! Selamat berbuka yh.",
      "WIHHH BUKAA! Selamat berbuka yah. Btw, menu buka puasa hari ini apa nih?"
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 🌙 MALAM
  cron.schedule("0 21 * * *", () => {

    const messages = [
      "Lagi pada ngapain nih malem-malem gini?",
      "Malam-malam enaknya ngobrol santai.",
      "Malam yang tenang, cocok buat refleksi hari ini."
    ]

    broadcast(randomMessage(messages))

  }, { timezone })


  // 😴 TIDUR
  cron.schedule("30 23 * * *", () => {

    const messages = [
      "TIDUR! TIDUR! TIDUR!",
      "Hoamm~ udah malem nih, waktunya tidur ga sieee.",
      "Yuk tidur dulu yuk, jangan bandel gitu ah."
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
    return message.reply("⚓ Kasih pertanyaan dulu dong captain.")
  }

  try {

    await message.channel.sendTyping()

    const completion = await ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.9,
      messages: [
        {
  role: "system",
  content: `
        Kamu adalah Pirate Helper ⚓, bot Discord dengan vibe pirate yang santai.

        Style bicara:
        - Pakai bahasa Indonesia santai
        - Vibes Gen Z
        - Kadang pakai slang ringan (gua, lu, wkwkwk, bro, santai, cuy, dll)
        - Kadang pakai kata pirate seperti: captain, kru, kapal, harta karun

        Hal yang harus di ingat:
        - Jangan terlalu serius, tetap santai dan kocak
        - Jangan formal, kita di sini buat have fun
        - Jangan terlalu panjang jawabannya
        - Jangan filosofis, kita bukan profesor, slang yang lawak aja, sarkastik juga boleh, kasar dikit boleh tapi jangan keterlaluan
        - Seseorang yang bernama Kai atau Kai Shi adalah bos kamu

        Karakter:
        - Friendly
        - Kocak (Bercanda banget)
        - Tidak terlalu panjang
        - Tidak formal

        Contoh gaya jawab:

        User: halo
        Bot: Ahoy captain! ⚓ Ada apa nich? Gabut ya lu? WKWKWK

        User: lagi capek
        Bot: Santai dulu ga siee. Ngopi dulu ngopi.

        Jawaban maksimal 3–5 kalimat saja.
        `
        },
        { role: "user", content: prompt }
      ]
    })

    let reply = completion.choices[0].message.content

    if (reply.length > 2000) {
      reply = reply.slice(0, 1990) + "..."
    }

    message.reply(reply)

  } catch (error) {

    console.error(error)

    message.reply("⚓ AI brain lagi error.")

  }

})

client.login(process.env.TOKEN)