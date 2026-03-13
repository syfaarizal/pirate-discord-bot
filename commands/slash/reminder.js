const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const {
  getConfig, setEnabled, setTime, resetConfig,
  isValid, VALID_REMINDERS, REMINDER_DEFAULTS
} = require("../../utils/reminderConfig")

function fmt(h, m) {
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
}

// ── Permission check ──
function isAdminOrMod(member) {
  if (!member) return false
  if (member.guild.ownerId === member.id) return true
  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) return true
  return member.roles.cache.some(r => {
    const n = r.name.toLowerCase()
    return n.includes("admin") || n.includes("mod")
  })
}

function denyNonAdmin(interaction) {
  return interaction.reply({
    content: "🔒 Command ini khusus Admin/Moderator. Lu bisa lihat jadwal pakai `/reminder list` kok.",
    ephemeral: true
  })
}

// ── Choices for options ──
const REMINDER_CHOICES = VALID_REMINDERS.map(r => ({ name: r, value: r }))
const REMINDER_CHOICES_WITH_ALL = [{ name: "all — semua reminder", value: "all" }, ...REMINDER_CHOICES]

// ── Slash command definition ──
const data = new SlashCommandBuilder()
  .setName("reminder")
  .setDescription("Manage jadwal reminder otomatis server ini")

  .addSubcommand(sub => sub
    .setName("list")
    .setDescription("Lihat semua jadwal reminder + statusnya")
  )

  .addSubcommand(sub => sub
    .setName("on")
    .setDescription("Aktifkan reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Pilih reminder atau 'all' untuk semua")
      .setRequired(true)
      .addChoices(...REMINDER_CHOICES_WITH_ALL)
    )
  )

  .addSubcommand(sub => sub
    .setName("off")
    .setDescription("Matikan reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Pilih reminder atau 'all' untuk semua")
      .setRequired(true)
      .addChoices(...REMINDER_CHOICES_WITH_ALL)
    )
  )

  .addSubcommand(sub => sub
    .setName("set-time")
    .setDescription("Ubah jam reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Pilih reminder")
      .setRequired(true)
      .addChoices(...REMINDER_CHOICES)
    )
    .addStringOption(opt => opt
      .setName("jam")
      .setDescription("Format HH:MM, contoh: 04:30")
      .setRequired(true)
    )
  )

  .addSubcommand(sub => sub
    .setName("reset")
    .setDescription("Reset semua reminder ke default — Admin/Mod only 🔒")
  )

// ── Handlers ──
async function handleList(interaction) {
  const config    = getConfig(interaction.guildId)
  const guildName = interaction.guild?.name || interaction.guildId

  const rows = VALID_REMINDERS.map(key => {
    const r      = config[key] ?? REMINDER_DEFAULTS[key]
    const status = r.enabled ? "✅ ON " : "❌ OFF"
    const jam    = fmt(r.hour, r.minute)
    const defJam = fmt(REMINDER_DEFAULTS[key].hour, REMINDER_DEFAULTS[key].minute)
    const custom = jam !== defJam ? " *(custom)*" : ""
    return `${r.emoji} \`${key.padEnd(12)}\` ${status}  \`${jam}\`${custom}`
  }).join("\n")

  const embed = {
    color: 0x5865f2,
    title: `⏰ Reminder Schedule — ${guildName}`,
    description: "Jadwal ini berlaku khusus untuk server ini aja.",
    fields: [
      { name: "Status & Jam (WIB)", value: rows },
      { name: "Admin/Mod Commands 🔒", value: [
        "`/reminder on <nama>` • `/reminder off <nama>`",
        "`/reminder on all` • `/reminder off all`",
        "`/reminder set-time <nama> <HH:MM>`",
        "`/reminder reset`",
        "`/set-reminder-channel`",
      ].join("\n") }
    ],
    footer: { text: "Pirate Helper • Config per server ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

async function handleToggle(interaction, enabled) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const name    = interaction.options.getString("nama")
  const guildId = interaction.guildId

  if (name === "all") {
    for (const key of VALID_REMINDERS) setEnabled(guildId, key, enabled)
    return interaction.reply({
      content: enabled
        ? "✅ Semua reminder server ini udah **ON**! Gua bakal nge-ping di semua jadwal. 🔔"
        : "❌ Semua reminder server ini udah **OFF**. Gak bakal spam kalian. Tenang 😌"
    })
  }

  setEnabled(guildId, name, enabled)
  const r   = getConfig(guildId)[name]
  const jam = fmt(r.hour, r.minute)

  return interaction.reply({
    content: enabled
      ? `${r.emoji} Reminder **${r.label}** ✅ ON! Bakal nge-ping jam \`${jam}\` tiap hari.`
      : `${r.emoji} Reminder **${r.label}** ❌ OFF. Gak bakal ganggu jam segitu lagi.`
  })
}

async function handleSetTime(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const name    = interaction.options.getString("nama")
  const timeStr = interaction.options.getString("jam")
  const guildId = interaction.guildId

  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return interaction.reply({ content: "Format jam salah bestie. Contoh: `04:30`, `18:00`", ephemeral: true })
  }

  const [h, m] = timeStr.split(":").map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return interaction.reply({ content: `Jam \`${timeStr}\` gak valid. Hour 0-23, minute 0-59. fr 💀`, ephemeral: true })
  }

  const defJam = fmt(REMINDER_DEFAULTS[name].hour, REMINDER_DEFAULTS[name].minute)
  setTime(guildId, name, h, m)
  const r = getConfig(guildId)[name]

  return interaction.reply({
    content: `${r.emoji} Jam **${r.label}** diubah: \`${defJam}\` → \`${fmt(h, m)}\` WIB. Catat!`
  })
}

async function handleReset(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)
  resetConfig(interaction.guildId)
  return interaction.reply({
    content: "🔄 Semua reminder di-reset ke default. Semua **ON**, jam balik ke bawaan."
  })
}

// ── Main execute ──
async function execute(interaction) {
  const sub = interaction.options.getSubcommand()
  if (sub === "list")     return handleList(interaction)
  if (sub === "on")       return handleToggle(interaction, true)
  if (sub === "off")      return handleToggle(interaction, false)
  if (sub === "set-time") return handleSetTime(interaction)
  if (sub === "reset")    return handleReset(interaction)
}

module.exports = { data, execute }