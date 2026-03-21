const cron = require("node-cron")
const { randomPick } = require("../utils/broadcast")
const { getAllConfigs, getMessages } = require("../utils/reminderConfig")

const timezone = "Asia/Jakarta"

const STARTUP_MESSAGES = [
  "Kichi udah aktif lagi cuy, semua sistem jalan fr ⚓",
  "abis restart, gua balik. kayak bad penny aja wkwk 🏴‍☠️",
]

async function sendToChannels(client, channels, message, { everyone = true } = {}) {
  for (const channelId of channels) {
    try {
      const channel = await client.channels.fetch(channelId)
      if (!channel) continue
      await channel.send({
        content: everyone ? `@everyone ${message}` : message,
        allowedMentions: everyone ? { parse: ["everyone"] } : { parse: [] }
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
    // Startup pakai everyone: false — gak ganggu pas debug
    await sendToChannels(client, config.channels, message, { everyone: false })
    totalSent += config.channels.length
    console.log(`📣 [Startup] Notif dikirim → guild ${guildId}`)
  }

  if (totalSent === 0) {
    console.log("⚠️ [Startup] Gak ada channel yang di-set. Jalanin /set-reminder-channel add dulu!")
  }
}

function registerCronJobs(client) {
  console.log("\n📅 Registering per-minute cron scheduler...")

  broadcastStartup(client)

  cron.schedule("* * * * *", async () => {
    const now    = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    const hour   = now.getHours()
    const minute = now.getMinutes()
    const configs = getAllConfigs()

    for (const [guildId, config] of Object.entries(configs)) {
      if (!config.channels?.length) continue

      // ── Built-in reminders (pagi, malam) ──
      for (const [key, reminder] of Object.entries(config)) {
        if (key === "channels" || key === "custom") continue
        if (!reminder?.hour === undefined) continue
        if (!reminder.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        const messages = getMessages(config, key)
        if (!messages.length) continue

        const message = randomPick(messages)
        await sendToChannels(client, config.channels, message, { everyone: true })
        console.log(`📣 [Cron] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
      }

      // ── Custom reminders ──
      for (const [key, reminder] of Object.entries(config.custom || {})) {
        if (!reminder.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        const messages = reminder.messages || []
        if (!messages.length) continue

        const message = randomPick(messages)
        await sendToChannels(client, config.channels, message, { everyone: true })
        console.log(`📣 [Cron:custom] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
      }
    }
  }, { timezone })

  console.log("✅ Cron registered!\n")
}

module.exports = { registerCronJobs }