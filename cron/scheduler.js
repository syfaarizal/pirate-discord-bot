const cron = require("node-cron")
const { randomPick } = require("../utils/broadcast")
const { getAllConfigs, REMINDER_DEFAULTS } = require("../utils/reminderConfig")

const timezone = "Asia/Jakarta"

const MESSAGES = {
  pagi: [
    "pagi crue!! semangat ya hari ini, atau minimal pura-pura semangat dulu ☀️",
    "morning!! vibes hari ini harus bagus, no excuse 🌞",
    "selamat pagi~ jangan lupa sarapan, jangan skip 🫡",
    "rise and shine bestie. hari ini bakal slay, fr fr ☀️",
    "pagi pagi~ semoga harinya gak berat-berat amat ya, fighting!! 🌤",
  ],
  malam: [
    "malem crue~ udah waktunya istirahat, jangan begadang mulu 🌙",
    "good night bestie!! besok masih ada hari baru, gak usah overthink 💤",
    "oke udah malem, yuk bobo. jangan yapping sampe subuh 😭🛌",
    "malam~ semoga istirahatnya enak dan mimpinya bagus fr 🌙",
    "gnight!! healing dulu, besok lanjut lagi 💤",
  ],
}

const IDUL_FITRI_MESSAGES = [
  "🌙✨ SELAMAT HARI RAYA IDUL FITRI 1446 H!! Minal aidin wal faizin, mohon maaf lahir dan batin ya crue~ semoga hari ini penuh kebahagiaan fr fr 🎉",
  "🌙✨ EID MUBARAK CRUE!! Taqabbalallahu minna wa minkum~ maaf kalau selama ini Kichi pernah annoying, no cap 😭🙏 selamat lebaran!!",
  "🌙✨ HAPPY EID AL-FITR!! Minal aidin wal faizin bestie~ semoga dosa-dosa kita diampuni dan hari ini hits different karena lebaran 🎉✨",
]

const STARTUP_MESSAGES = [
  "gua balik lagi 🏴‍☠️ ada yang kangen? jangan jawab.",
  "online~ missed me? jangan bohong 💀",
  "Kichi udah aktif lagi cuy, semua sistem jalan fr ⚓",
  "abis restart, gua balik. kayak bad penny aja wkwk 🏴‍☠️",
]

// Tanggal spesial Idul Fitri: 21 Maret 2026, jam 07:00 WIB
const IDUL_FITRI = { date: 21, month: 2, year: 2026, hour: 7, minute: 0 } // month: 0-indexed (2 = Maret)

// Track biar Idul Fitri cuma kekirim sekali
let idulFitriSent = false

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

function isIdulFitriTime(now) {
  return (
    !idulFitriSent &&
    now.getFullYear()  === IDUL_FITRI.year   &&
    now.getMonth()     === IDUL_FITRI.month  &&
    now.getDate()      === IDUL_FITRI.date   &&
    now.getHours()     === IDUL_FITRI.hour   &&
    now.getMinutes()   === IDUL_FITRI.minute
  )
}

function registerCronJobs(client) {
  console.log("\n📅 Registering per-minute cron scheduler...")

  broadcastStartup(client)

  cron.schedule("* * * * *", async () => {
    const now     = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    const hour    = now.getHours()
    const minute  = now.getMinutes()
    const configs = getAllConfigs()

    // ── Cek Idul Fitri special broadcast ──
    if (isIdulFitriTime(now)) {
      idulFitriSent = true
      const eidMsg = randomPick(IDUL_FITRI_MESSAGES)
      console.log("🌙 [Idul Fitri] Ngirim ucapan ke semua guild!")
      for (const [guildId, config] of Object.entries(configs)) {
        if (!config.channels?.length) continue
        await sendToChannels(client, config.channels, eidMsg)
        console.log(`   ✅ Guild ${guildId} done`)
      }
    }

    // ── Reminder harian biasa ──
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