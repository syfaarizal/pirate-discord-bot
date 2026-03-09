require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const cron = require("node-cron")

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

const channels = process.env.CHANNEL_IDS.split(",")

function broadcast(message) {
  channels.forEach((id) => {
    const channel = client.channels.cache.get(id)

    if (channel) {
      channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })
    }
  })
}

function randomMessage(list) {
  return list[Math.floor(Math.random() * list.length)]
}

client.once("clientReady", () => {
  console.log(`🌙 Bot Ramadhan aktif sebagai ${client.user.tag}`)

  broadcast("🌙 Halo semua! Ramadhan vibes mode ON. Semoga puasanya lancar ya!")

  // 🌙 SAHUR
  cron.schedule("30 3 * * *", () => {
    const messages = [
      "🌙 Sahur time! Bangun bangun, jangan sampe kesiangan!",
      "🍚 Alarm sahur bunyi! Gas makan dulu sebelum lanjut tidur lagi.",
      "👀 Siapa yang masih melek? Yuk sahur dulu sebelum imsak.",
      "⚡ Quick reminder: isi energi dulu, nanti lanjut mimpi indah."
    ]

    broadcast(randomMessage(messages))
  })

  // 😴 HABIS SUBUH
  cron.schedule("45 4 * * *", () => {
    const messages = [
      "😴 Abis subuh, waktunya balik rebahan.",
      "🛏️ Crew yang begadang: ini waktunya tidur dulu ya.",
      "🌙 Subuh done. Sekarang recharge energy mode."
    ]

    broadcast(randomMessage(messages))
  })

  // 🌞 PAGI
  cron.schedule("0 7 * * *", () => {
    const messages = [
      "🌞 Selamat pagi! Semoga hari ini lancar puasanya.",
      "☀️ Morning check! Jangan lupa minum... eh, puasa ding.",
      "✨ Hari baru, semangat baru. Walau perut kosong."
    ]

    broadcast(randomMessage(messages))
  })

  // 😴 TIDUR SIANG
  cron.schedule("0 12 * * *", () => {
    const messages = [
      "😴 Siang vibes. Saatnya power nap sebentar.",
      "🛌 Tidur siang bentar biar kuat sampe buka.",
      "⚡ Energy saving mode: tidur dulu ga sih."
    ]

    broadcast(randomMessage(messages))
  })

  // 🌤 NGABUBURIT
  cron.schedule("30 16 * * *", () => {
    const messages = [
      "🌤 Ngabuburit time! Siapa yang mulai keliling cari takjil?",
      "🍩 Misi sore hari: hunting takjil.",
      "👀 Siapa yang udah mulai mikirin es buah?"
    ]

    broadcast(randomMessage(messages))
  })

  // 🌇 BUKA PUASA
  cron.schedule("0 18 * * *", () => {
    const messages = [
      "🌇 Buka puasa time! Minum dulu yang manis.",
      "🍹 Azan maghrib! Saatnya batalin puasa.",
      "⚡ Takjil yang ditunggu akhirnya datang juga."
    ]

    broadcast(randomMessage(messages))
  })

  // 🌙 MALAM
  cron.schedule("0 21 * * *", () => {
    const messages = [
      "🌙 Malam Ramadhan vibes. Lagi santai apa nih?",
      "✨ Night chill session dimulai.",
      "🍵 Malam-malam enaknya ngobrol santai."
    ]

    broadcast(randomMessage(messages))
  })

  // 😴 TIDUR
  cron.schedule("30 23 * * *", () => {
    const messages = [
      "😴 Waktunya istirahat. Jangan lupa set alarm sahur!",
      "🌙 Good night! Semoga besok puasanya lancar lagi.",
      "🛌 Sleep mode activated. Sampai ketemu di sahur nanti."
    ]

    broadcast(randomMessage(messages))
  })
})

client.login(process.env.TOKEN)