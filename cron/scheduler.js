const cron = require("node-cron")
const { randomPick } = require("../utils/broadcast")
const { getAllConfigs, REMINDER_DEFAULTS } = require("../utils/reminderConfig")

const timezone = "Asia/Jakarta"

const MESSAGES = {
  sahur: [
    "OI BANGUN SAHUR ANJIR 🍚 gua tau males tapi ya harus lah",
    "sahur cuy jangan skip nanti lemes sendiri 💀",
    "SAHUR!! kalian makan apa btw? gua penasaran",
    "banguuun~ sahur dulu baru boleh tidur lagi fr",
  ],
  subuh: [
    "subuh udah, mau balik tidur? understood the assignment 😏",
    "kaum balik tidur setelah subuh rise up 💀",
    "tidur lagi setelah subuh hits different ngl. tapi jangan kesiangan ya",
  ],
  pagi: [
    "pagi crue!! semangat atau minimal pura-pura semangat ☀️",
    "selamat pagi~ jangan kebuka kulkas loh ya 🫡",
    "rise and shine bestie. hari ini harus slay no excuse",
    "morning!! vibes hari ini gimana? semoga bagus fr",
  ],
  siang: [
    "jam 12 siang. perut laper, mata berat. valid banget tidur siang 💤",
    "siang-siang gini paling bener energy saving mode on wkwk",
    "jam segini tuh ujian banget. tapi kalian kuat no cap 💪",
  ],
  ngabuburit: [
    "bentar lagi buka cuy tahan dikit 🌅",
    "ngabuburit time~ mau ngapain? semua pilihan valid fr",
    "sore-sore vibes-nya beda ya. hampir sampe bestie 🙏",
  ],
  buka: [
    "BUKAAAAA CUY KALIAN SURVIVE!! FR FR SLAY 🎉",
    "WIHH BUKA!! selamat berbuka, kalian kuat banget sumpah 🍽️",
    "MAKAN WAKTU NYA!! pelan-pelan dulu jangan kalap 😭",
    "BUKA PUASA!! understood the assignment seharian, reward yourself 🌙",
  ],
  malam: [
    "malam crue~ pada ngapain? kalau mau ngobrol gua ada 😌",
    "malem-malem vibes-nya santai ya. gimana hari ini?",
    "evening check~ abis buka ngapain aja? 👀",
  ],
  tidur: [
    "TIDUR CUY udah jam segini 😭🛌 besok sahur lagi",
    "hoamm yuk tidur, jangan yapping mulu 💤",
    "ini reminder buat tidur. gua serius. fr fr. gnight 🌙",
    "BOBO!! no debate, understood the assignment ya 🛌",
  ],
}

const STARTUP_MESSAGES = [
  "gua balik lagi 🏴‍☠️ ada yang kangen? jangan jawab.",
  "online~ missed me? jangan bohong 💀",
  "Kichi udah aktif lagi cuy, semua sistem jalan fr ⚓",
  "abis restart, gua balik. kayak bad penny aja wkwk 🏴‍☠️",
]

async function sendToChannels(client, channels, message) {
  for (const channelId of channels) {
    try {
      const channel = await client.channels.fetch(channelId)
      if (!channel) continue
      await channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })
    } catch (err) {
      console.error(`⚠️ Gagal kirim ke channel ${channelId}:`, err.message)
    }
  }
}

async function broadcastStartup(client) {
  const configs = getAllConfigs()
  const message = randomPick(STARTUP_MESSAGES)
  let totalSent = 0

  for (const [guildId, config] of Object.entries(configs)) {
    if (!config.channels?.length) continue
    await sendToChannels(client, config.channels, message)
    totalSent += config.channels.length
    console.log(`📣 [Startup] Notif dikirim → guild ${guildId}`)
  }

  if (totalSent === 0) {
    console.log("⚠️ [Startup] Gak ada channel yang di-set. Jalanin /set-reminder-channel dulu!")
  }
}

function registerCronJobs(client) {
  console.log("\n📅 Registering per-minute cron scheduler...")

  broadcastStartup(client)

  cron.schedule("* * * * *", async () => {
    const now     = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    const hour    = now.getHours()
    const minute  = now.getMinutes()
    const configs = getAllConfigs()

    for (const [guildId, config] of Object.entries(configs)) {
      if (!config.channels?.length) continue

      for (const key of Object.keys(MESSAGES)) {
        const reminder = config[key] ?? REMINDER_DEFAULTS[key]
        if (!reminder.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        const message = randomPick(MESSAGES[key])
        await sendToChannels(client, config.channels, message)
        console.log(`📣 [Cron] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`)
      }
    }
  }, { timezone })

  console.log("✅ Cron registered!\n")
}

module.exports = { registerCronJobs }