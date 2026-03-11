const { getConfig, setEnabled, setTime, resetConfig, isValid, VALID_REMINDERS, DEFAULTS } = require("../utils/reminderConfig")
const { rescheduleAll } = require("../cron/scheduler")

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

async function handleList(message) {
  const guildId = message.guildId
  const config = getConfig(guildId)
  const guildName = message.guild?.name || guildId

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
    title: `⏰ Reminder Schedule — ${guildName}`,
    description: "Jadwal reminder server ini. Setiap server bisa punya jadwal yang beda.",
    fields: [
      {
        name: "Status & Jam (WIB)",
        value: rows,
        inline: false
      },
      {
        name: "Commands",
        value: [
          "`@bot reminder on <nama>` — aktifkan satu reminder",
          "`@bot reminder off <nama>` — matikan satu reminder",
          "`@bot reminder on all` — aktifkan **semua** reminder",
          "`@bot reminder off all` — matikan **semua** reminder",
          "`@bot reminder set <nama> <HH:MM>` — ubah jam reminder",
          "`@bot reminder reset` — reset semua ke default",
          "",
          `Nama valid: \`all\`, \`${VALID_REMINDERS.join("`, `")}\``
        ].join("\n"),
        inline: false
      }
    ],
    footer: { text: "Pirate Helper • Config berlaku per server ⚓" },
    timestamp: new Date().toISOString()
  }

  return message.reply({ embeds: [embed] })
}

async function handleToggleAll(message, enabled) {
  const guildId = message.guildId
  for (const name of VALID_REMINDERS) {
    setEnabled(guildId, name, enabled)
  }
  rescheduleAll()

  if (enabled) {
    return message.reply("✅ Semua reminder server ini udah **ON** lagi cuy! Gua bakal nge-ping di semua jadwal. 🔔")
  } else {
    return message.reply("❌ Semua reminder server ini udah **OFF**. Gua gak bakal spam kalian. Tenang 😌")
  }
}

async function handleToggle(message, name, enabled) {
  if (name === "all" || name === "semua") {
    return handleToggleAll(message, enabled)
  }

  if (!name || !isValid(name)) {
    return message.reply(
      `Nama reminder **${name || "?"}** gak valid cuy 😅\nYang valid: \`all\`, \`${VALID_REMINDERS.join("`, `")}\``
    )
  }

  const guildId = message.guildId
  setEnabled(guildId, name, enabled)
  rescheduleAll()

  const config = getConfig(guildId)
  const r = config[name]
  const action = enabled ? "✅ diaktifkan" : "❌ dimatikan"
  const jam = formatTime(r.hour, r.minute)

  const replies = enabled
    ? [
        `Oke, reminder **${r.emoji} ${r.label}** ${action} untuk server ini! Bakal nge-ping jam \`${jam}\` tiap hari.`,
        `Siap! **${r.emoji} ${r.label}** udah on lagi di server ini, jam \`${jam}\` WIB.`,
        `${r.emoji} Reminder **${r.label}** ${action}. Jam \`${jam}\` gua bakal nge-ping, siap-siap ya.`
      ]
    : [
        `Oke, reminder **${r.emoji} ${r.label}** ${action} untuk server ini. Gua gak bakal ganggu jam segitu lagi.`,
        `Roger! **${r.emoji} ${r.label}** udah off di server ini. Kalau mau on lagi tinggal bilang.`,
        `${r.emoji} **${r.label}** ${action}. Tenang, gua gak akan spam. fr fr.`
      ]

  return message.reply(replies[Math.floor(Math.random() * replies.length)])
}

async function handleSet(message, args) {
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
    return message.reply("Format jamnya salah bestie. Pake format `HH:MM`, contoh: `04:30`, `18:00`")
  }

  const [hourStr, minuteStr] = timeStr.split(":")
  const hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return message.reply(`Jam **${timeStr}** gak valid cuy. Hour 0-23, minute 0-59. Basic math fr 💀`)
  }

  const guildId = message.guildId
  const defaultJam = formatTime(DEFAULTS[name].hour, DEFAULTS[name].minute)
  const newJam = formatTime(hour, minute)

  setTime(guildId, name, hour, minute)
  rescheduleAll()

  const config = getConfig(guildId)
  const r = config[name]

  return message.reply(
    `${r.emoji} Jam reminder **${r.label}** di server ini berhasil diubah!\n\`${defaultJam}\` → \`${newJam}\` WIB. Gua catat, besok langsung berlaku.`
  )
}

async function handleReset(message) {
  const guildId = message.guildId
  resetConfig(guildId)
  rescheduleAll()

  return message.reply(
    "🔄 Semua reminder server ini udah di-reset ke default. Semua **ON**, jam balik ke bawaan. Fresh start!"
  )
}

async function reminderCommand(message, client) {
  const content = message.content
    .replace(/<@!?[0-9]+>/g, "")
    .trim()

  const parts = content.split(/\s+/)
  const sub = parts[1]?.toLowerCase()

  if (!sub || sub === "list") return handleList(message)
  if (sub === "on" || sub === "off") return handleToggle(message, parts[2]?.toLowerCase(), sub === "on")
  if (sub === "set") return handleSet(message, parts.slice(1))
  if (sub === "reset") return handleReset(message)

  return message.reply(
    `Subcommand **${sub}** gak dikenal cuy 😅\nCoba: \`list\`, \`on\`, \`off\`, \`set\`, atau \`reset\``
  )
}

module.exports = { reminderCommand }