const cron = require("node-cron")
const { randomPick } = require("../utils/broadcast")
const { getAllConfigs, getMessages, BUILT_IN_KEYS } = require("../utils/reminderConfig")

const timezone = "Asia/Jakarta"
const STARTUP_CHANNEL_ID = process.env.STARTUP_CHANNEL_ID?.trim()

const STARTUP_MESSAGES = [
  "abis restart, gua balik. kayak bad penny aja wkwk 🏴‍☠️",
]

async function sendToChannels(client, channels, message) {
  for (const channelId of channels) {
    try {
      const channel = await client.channels.fetch(channelId)
      if (!channel) continue
      await channel.send({ content: message })
    } catch (err) {
      console.error(`⚠️ Gagal kirim ke channel ${channelId}:`, err.message)
    }
  }
}

async function broadcastStartup(client) {
  const message = randomPick(STARTUP_MESSAGES)
  if (!STARTUP_CHANNEL_ID) {
    console.log("ℹ️ [Startup] STARTUP_CHANNEL_ID belum di-set, skip startup notif.")
    return
  }

  try {
    const channel = await client.channels.fetch(STARTUP_CHANNEL_ID)
    if (!channel) {
      console.log(`⚠️ [Startup] Channel ${STARTUP_CHANNEL_ID} gak ketemu.`)
      return
    }

    await channel.send({ content: message })
    console.log(`📣 [Startup] Notif dikirim ke channel ${STARTUP_CHANNEL_ID}`)
  } catch (err) {
    console.error(`⚠️ [Startup] Gagal kirim ke ${STARTUP_CHANNEL_ID}:`, err.message)
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

      // ── Built-in reminders ──
      for (const key of BUILT_IN_KEYS) {
        const reminder = config[key]
        if (!reminder?.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        const messages = getMessages(config, key)
        if (!messages.length) continue

        const message = randomPick(messages)
        await sendToChannels(client, config.channels, message)
        console.log(`📣 [Cron] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
      }

      // ── Custom reminders ──
      for (const [key, reminder] of Object.entries(config.custom || {})) {
        if (!reminder.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        const messages = reminder.messages || []
        if (!messages.length) continue

        const message = randomPick(messages)
        await sendToChannels(client, config.channels, message)
        console.log(`📣 [Cron:custom] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
      }
    }
  }, { timezone })

  console.log("✅ Cron registered!\n")
}

module.exports = { registerCronJobs }