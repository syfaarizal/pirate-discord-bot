require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const cron = require("node-cron")

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

// ambil channel IDs dari ENV
const CHANNEL_IDS = process.env.CHANNEL_IDS
  .split(",")
  .map(id => id.trim())
  .filter(Boolean)

const timezone = "Asia/Jakarta"

function broadcast(message) {
  CHANNEL_IDS.forEach((id) => {
    const channel = client.channels.cache.get(id)

    if (!channel) {
      console.log(`⚠️ Channel tidak ditemukan: ${id}`)
      return
    }

    channel.send({
      content: `@everyone ${message}`,
      allowedMentions: { parse: ["everyone"] }
    })
  })
}

function randomMessage(list) {
  return list[Math.floor(Math.random() * list.length)]
}

client.once("clientReady", () => {
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
      "Lagi pada ngapain nih malem-malem gini? Kalo gabut, ngobrol santai boleh juga.",
      "Malam-malam enaknya ngobrol santai.",
      "Malam yang tenang, cocok buat refleksi hari ini."
    ]

    broadcast(randomMessage(messages))
  }, { timezone })

  // 😴 TIDUR
  cron.schedule("30 23 * * *", () => {
    const messages = [
      "TIDUR! TIDUR! TIDUR! TIDUR! TIDUR!",
      "Hoamm~ udah malem nih, waktunya tidur ga sieee. Yang kalong bodoamat.",
      "Yuk tidur dulu yuk, jangan bandel gitu ah."
    ]

    broadcast(randomMessage(messages))
  }, { timezone })
})

client.login(process.env.TOKEN)