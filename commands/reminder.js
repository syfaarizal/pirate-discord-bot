const { getConfig, setEnabled, setTime, isValid, VALID_REMINDERS, DEFAULTS } = require("../utils/reminderConfig")
const { rescheduleAll } = require("../cron/scheduler")

// ─────────────────────────────────────
// Helper: format jam jadi HH:MM
// ─────────────────────────────────────
function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

// ─────────────────────────────────────
// Subcommand: list
// ─────────────────────────────────────
async function handleList(message) {
  const config = getConfig()

  const rows = VALID_REMINDERS.map(key => {
    const r = config[key]
    const status = r.enabled ? "✅ ON " : "❌ OFF"
    const jam = formatTime(r.hour, r.minute)
    const defaultJam = formatTime(DEFAULTS[key].hour, DEFAULTS[key].minute)
    const isCustom = jam !== defaultJam ? ` *(custom, default: ${defaultJam})*` : ""
    return `${r.emoji} \`${key.padEnd(12)}\` ${status}  \`${jam}\`${isCustom}`
  }).join("\n")

  const embed = {
    color: 0x5865f2,
    title: "⏰ Reminder Schedule",
    description: "Ini semua reminder yang ada. Lu bisa atur sendiri mana yang mau diaktifin atau dimatiin.",
    fields: [
      {
        name: "Status & Jam",
        value: rows,
        inline: false
      },
      {
        name: "Commands",
        value: [
          "`@bot reminder on <nama>` — aktifkan",
          "`@bot reminder off <nama>` — matikan",
          "`@bot reminder set <nama> <HH:MM>` — ubah jam",
          "`@bot reminder reset` — reset semua ke default",
          "",
          `Nama yang valid: \`${VALID_REMINDERS.join("\`, \`")}\``
        ].join("\n"),
        inline: false
      }
    ],
    footer: { text: "Pirate Helper • Reminder System ⚓" },
    timestamp: new Date().toISOString()
  }

  return message.reply({ embeds: [embed] })
}

// ─────────────────────────────────────
// Subcommand: on / off
// ─────────────────────────────────────
async function handleToggle(message, name, enabled, client) {
  if (!isValid(name)) {
    return message.reply(
      `Nama reminder **${name}** gak valid cuy 😅\nYang valid: \`${VALID_REMINDERS.join("`, `")}\``
    )
  }

  setEnabled(name, enabled)
  rescheduleAll(client)

  const config = getConfig()
  const r = config[name]
  const action = enabled ? "✅ diaktifkan" : "❌ dimatikan"
  const jam = formatTime(r.hour, r.minute)

  const replies = enabled
    ? [
        `Oke, reminder **${r.emoji} ${r.label}** ${action}! Bakal nge-ping jam \`${jam}\` tiap hari.`,
        `Siap! **${r.emoji} ${r.label}** udah on lagi, jam \`${jam}\` WIB. No cap gua bakal ingetin.`,
        `${r.emoji} Reminder **${r.label}** ${action}. Jam \`${jam}\` gua bakal nge-ping, siap-siap ya.`
      ]
    : [
        `Oke, reminder **${r.emoji} ${r.label}** ${action}. Gua gak bakal ganggu jam segitu lagi.`,
        `Roger! **${r.emoji} ${r.label}** udah off. Kalau mau on lagi tinggal bilang.`,
        `${r.emoji} **${r.label}** ${action}. Tenang, gua gak akan spam. fr fr.`
      ]

  const pick = replies[Math.floor(Math.random() * replies.length)]
  return message.reply(pick)
}

// ─────────────────────────────────────
// Subcommand: set <nama> <HH:MM>
// ─────────────────────────────────────
async function handleSet(message, args, client) {
  // args = ["set", "sahur", "04:30"]
  const name = args[1]
  const timeStr = args[2]

  if (!name) {
    return message.reply("Nama reminder mana nih? Contoh: `@bot reminder set sahur 04:30`")
  }

  if (!isValid(name)) {
    return message.reply(
      `Nama reminder **${name}** gak ada cuy 😅\nYang valid: \`${VALID_REMINDERS.join("`, `")}\``
    )
  }

  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return message.reply(
      `Format jamnya salah bestie. Pake format \`HH:MM\`, contoh: \`04:30\`, \`18:00\``
    )
  }

  const [hourStr, minuteStr] = timeStr.split(":")
  const hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return message.reply(
      `Jam **${timeStr}** gak valid cuy. Hour 0-23, minute 0-59. Basic math fr 💀`
    )
  }

  setTime(name, hour, minute)
  rescheduleAll(client)

  const config = getConfig()
  const r = config[name]
  const defaultJam = formatTime(DEFAULTS[name].hour, DEFAULTS[name].minute)
  const newJam = formatTime(hour, minute)

  return message.reply(
    `${r.emoji} Jam reminder **${r.label}** berhasil diubah!\n\`${defaultJam}\` → \`${newJam}\` WIB. Gua catat, jangan khawatir.`
  )
}

// ─────────────────────────────────────
// Subcommand: reset
// ─────────────────────────────────────
async function handleReset(message, client) {
  const { saveConfig } = require("../utils/reminderConfig")
  // Reset ke default dengan deep copy
  const fresh = JSON.parse(JSON.stringify(DEFAULTS))

  // Harus import fs langsung karena saveConfig ada di reminderConfig
  const fs = require("fs")
  const path = require("path")
  const CONFIG_PATH = path.join(__dirname, "../data/reminders.json")
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(fresh, null, 2), "utf-8")

  rescheduleAll(client)

  return message.reply(
    "🔄 Semua reminder udah di-reset ke default. Fresh start! Semua **ON**, jam balik ke bawaan."
  )
}

// ─────────────────────────────────────
// Main handler
// ─────────────────────────────────────
async function reminderCommand(message, client) {
  const content = message.content
    .replace(/<@!?[0-9]+>/g, "")
    .trim()

  // Ambil args setelah "reminder"
  const parts = content.split(/\s+/)
  // parts[0] = "reminder", parts[1] = subcommand, dst
  const sub = parts[1]?.toLowerCase()

  if (!sub || sub === "list") {
    return handleList(message)
  }

  if (sub === "on" || sub === "off") {
    return handleToggle(message, parts[2]?.toLowerCase(), sub === "on", client)
  }

  if (sub === "set") {
    return handleSet(message, parts.slice(1), client)
  }

  if (sub === "reset") {
    return handleReset(message, client)
  }

  // Unknown subcommand
  return message.reply(
    `Subcommand **${sub}** gak dikenal cuy 😅\nCoba: \`@bot reminder list\`, \`on\`, \`off\`, \`set\`, atau \`reset\``
  )
}

module.exports = { reminderCommand }