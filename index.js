require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const cron = require("node-cron")

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

// ambil semua channel dari env
const channels = process.env.CHANNEL_IDS.split(",")

// helper function kirim pesan ke semua channel
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

// random picker
function randomMessage(list) {
  return list[Math.floor(Math.random() * list.length)]
}

client.once("clientReady", () => {
  console.log(`⚓ Bot online sebagai ${client.user.tag}`)

  broadcast("⚓ Pirate Helper dah online ya bang!")

  // 🌙 SAHUR
  cron.schedule("30 3 * * *", () => {
    const messages = [
      "🌙 Sahur time crew! Jangan lupa makan biar kuat ngoding nanti ⚓",
      "🍚 Wake up pirates! Sahur dulu sebelum berlayar di lautan code.",
      "⚓ Captain reminder: sahur dulu, bug nanti."
    ]

    broadcast(randomMessage(messages))
  })

  // 😴 HABIS SUBUH (TIDUR)
  cron.schedule("45 4 * * *", () => {
    broadcast("😴 Waktunya tidur crew. Recharge energy sebelum coding lagi.")
  })

  // 🌞 PAGI
  cron.schedule("0 7 * * *", () => {
    const messages = [
      "🌞 Good morning pirates! Saatnya produktif lagi.",
      "⚓ Pagi crew! Progress kecil tetap progress.",
      "💻 Morning coding session dimulai."
    ]

    broadcast(randomMessage(messages))
  })

  // 🔥 SORE CODING
  cron.schedule("30 16 * * *", () => {
    broadcast("🔥 Late afternoon coding session. Drop progress kalian!")
  })

  // 🌇 BUKA PUASA
  cron.schedule("0 18 * * *", () => {
    const messages = [
      "🌇 Waktunya buka puasa! Jangan lupa minum dulu sebelum commit code.",
      "🍹 Iftar time pirates! Break dulu dari debugging.",
      "⚓ Captain says: buka puasa dulu, bug bisa nunggu."
    ]

    broadcast(randomMessage(messages))
  })

  // 🌙 NIGHT CODING
  cron.schedule("0 21 * * *", () => {
    broadcast("💻 Night coding session dimulai. Let's ship some code ⚓")
  })

  // 😴 SLEEP
  cron.schedule("30 23 * * *", () => {
    broadcast("🌙 Captain reminder: commit code sebelum tidur ⚓")
  })
})

client.login(process.env.TOKEN)