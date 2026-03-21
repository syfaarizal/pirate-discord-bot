const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const {
  getConfig, getMessages,
  setEnabled, setTime, resetConfig,
  addCustomReminder, deleteCustomReminder,
  addReminderText, removeReminderText, resetMessages,
  BUILT_IN_KEYS, REMINDER_DEFAULTS, DEFAULT_MESSAGES,
} = require("../../utils/reminderConfig")

function fmt(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
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

function getAllReminderKeys(config) {
  const builtIn = BUILT_IN_KEYS
  const custom  = Object.keys(config.custom || {})
  return [...builtIn, ...custom]
}

const data = new SlashCommandBuilder()
  .setName("reminder")
  .setDescription("Manage jadwal reminder otomatis server ini")

  // list — semua user
  .addSubcommand(sub => sub
    .setName("list")
    .setDescription("Lihat semua jadwal reminder + statusnya")
  )

  // on — admin/mod
  .addSubcommand(sub => sub
    .setName("on")
    .setDescription("Aktifkan reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Key reminder (contoh: pagi, malam, siang, atau 'all')")
      .setRequired(true)
    )
  )

  // off — admin/mod
  .addSubcommand(sub => sub
    .setName("off")
    .setDescription("Matikan reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Key reminder (contoh: pagi, malam, siang, atau 'all')")
      .setRequired(true)
    )
  )

  // set-time — admin/mod
  .addSubcommand(sub => sub
    .setName("set-time")
    .setDescription("Ubah jam reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Key reminder (contoh: pagi, malam, siang)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("jam")
      .setDescription("Format HH:MM, contoh: 04:30")
      .setRequired(true)
    )
  )

  // add — buat custom reminder baru
  .addSubcommand(sub => sub
    .setName("add")
    .setDescription("Buat custom reminder baru — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("key")
      .setDescription("ID unik untuk reminder ini (huruf kecil, tanpa spasi, contoh: siang)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("label")
      .setDescription("Nama tampilan reminder (contoh: Istirahat Siang)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("jam")
      .setDescription("Jam kirim, format HH:MM (contoh: 12:00)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("emoji")
      .setDescription("Emoji untuk reminder ini (opsional, default: 🔔)")
      .setRequired(false)
    )
  )

  // delete — hapus custom reminder
  .addSubcommand(sub => sub
    .setName("delete")
    .setDescription("Hapus custom reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("key")
      .setDescription("Key custom reminder yang mau dihapus")
      .setRequired(true)
    )
  )

  // add-text — tambah teks ke reminder
  .addSubcommand(sub => sub
    .setName("add-text")
    .setDescription("Tambah teks pesan ke reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Key reminder (contoh: pagi, malam, siang)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("teks")
      .setDescription("Teks pesan yang mau ditambah (maks 500 karakter)")
      .setRequired(true)
      .setMaxLength(500)
    )
  )

  // remove-text — hapus teks dari reminder
  .addSubcommand(sub => sub
    .setName("remove-text")
    .setDescription("Hapus salah satu teks dari reminder — Admin/Mod only 🔒")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Key reminder (contoh: pagi, malam, siang)")
      .setRequired(true)
    )
    .addIntegerOption(opt => opt
      .setName("nomor")
      .setDescription("Nomor teks yang mau dihapus (lihat daftar pakai /reminder list-text)")
      .setRequired(true)
      .setMinValue(1)
    )
  )

  // list-text — lihat semua teks sebuah reminder
  .addSubcommand(sub => sub
    .setName("list-text")
    .setDescription("Lihat semua teks pesan sebuah reminder")
    .addStringOption(opt => opt
      .setName("nama")
      .setDescription("Key reminder (contoh: pagi, malam, siang)")
      .setRequired(true)
    )
  )

  // reset — reset jadwal ke default (custom reminders tetap)
  .addSubcommand(sub => sub
    .setName("reset")
    .setDescription("Reset jadwal built-in ke default — Admin/Mod only 🔒")
  )

// ────────────────────────────────────────────────────
// ── Handlers ──
// ────────────────────────────────────────────────────

async function handleList(interaction) {
  const config    = getConfig(interaction.guildId)
  const guildName = interaction.guild?.name || interaction.guildId

  // Built-in
  const builtInRows = BUILT_IN_KEYS.map(key => {
    const r      = config[key]
    const status = r.enabled ? "✅ ON " : "❌ OFF"
    const jam    = fmt(r.hour, r.minute)
    const defJam = fmt(REMINDER_DEFAULTS[key].hour, REMINDER_DEFAULTS[key].minute)
    const custom = jam !== defJam ? " *(custom)*" : ""
    const msgCount = getMessages(config, key).length
    return `${r.emoji} \`${key.padEnd(10)}\` ${status}  \`${jam}\`${custom}  _(${msgCount} teks)_`
  }).join("\n")

  // Custom
  const customEntries = Object.entries(config.custom || {})
  const customRows = customEntries.length > 0
    ? customEntries.map(([key, r]) => {
        const status = r.enabled ? "✅ ON " : "❌ OFF"
        const jam    = fmt(r.hour, r.minute)
        const msgCount = (r.messages || []).length
        return `${r.emoji} \`${key.padEnd(10)}\` ${status}  \`${jam}\`  _(${msgCount} teks)_`
      }).join("\n")
    : "_Belum ada custom reminder. Buat pakai `/reminder add`_"

  const channelCount = config.channels.length
  const channelInfo  = channelCount > 0
    ? `${channelCount} channel terdaftar — lihat: \`/set-reminder-channel list\``
    : "⚠️ Belum ada channel! Pakai `/set-reminder-channel add` dulu."

  const embed = {
    color: 0x5865f2,
    title: `⏰ Reminder Schedule — ${guildName}`,
    description: "Jadwal ini berlaku khusus untuk server ini. Lihat teks pesan pakai `/reminder list-text <nama>`.",
    fields: [
      { name: "🔒 Built-in Reminders", value: builtInRows },
      { name: "✨ Custom Reminders",   value: customRows },
      { name: "📢 Channel Tujuan",     value: channelInfo },
      { name: "Admin/Mod Commands 🔒", value: [
        "`/reminder on/off <nama>` — toggle (pakai 'all' untuk semua)",
        "`/reminder set-time <nama> <HH:MM>` — ubah jam",
        "`/reminder add <key> <label> <jam>` — buat custom reminder baru",
        "`/reminder delete <key>` — hapus custom reminder",
        "`/reminder add-text <nama> <teks>` — tambah teks pesan",
        "`/reminder remove-text <nama> <nomor>` — hapus teks pesan",
        "`/reminder list-text <nama>` — lihat semua teks",
        "`/reminder reset` — reset built-in ke default",
      ].join("\n") },
    ],
    footer: { text: "Pirate Helper • Config per server ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

async function handleToggle(interaction, enabled) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const name    = interaction.options.getString("nama").toLowerCase().trim()
  const guildId = interaction.guildId
  const config  = getConfig(guildId)

  if (name === "all") {
    for (const key of BUILT_IN_KEYS) setEnabled(guildId, key, enabled)
    for (const key of Object.keys(config.custom || {})) setEnabled(guildId, key, enabled)
    return interaction.reply({
      content: enabled
        ? "✅ Semua reminder (built-in + custom) udah **ON**! 🔔"
        : "❌ Semua reminder udah **OFF**. Gak bakal spam kalian. Tenang 😌"
    })
  }

  const allKeys = [...BUILT_IN_KEYS, ...Object.keys(config.custom || {})]
  if (!allKeys.includes(name)) {
    return interaction.reply({
      content: `⚠️ Reminder \`${name}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true
    })
  }

  setEnabled(guildId, name, enabled)
  const updated = getConfig(guildId)
  const r       = BUILT_IN_KEYS.includes(name) ? updated[name] : updated.custom[name]
  const jam     = fmt(r.hour, r.minute)

  return interaction.reply({
    content: enabled
      ? `${r.emoji} Reminder **${r.label}** ✅ ON! Bakal nge-ping jam \`${jam}\` WIB tiap hari.`
      : `${r.emoji} Reminder **${r.label}** ❌ OFF. Gak bakal ganggu jam segitu lagi.`
  })
}

async function handleSetTime(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const name    = interaction.options.getString("nama").toLowerCase().trim()
  const timeStr = interaction.options.getString("jam")
  const guildId = interaction.guildId
  const config  = getConfig(guildId)

  const allKeys = [...BUILT_IN_KEYS, ...Object.keys(config.custom || {})]
  if (!allKeys.includes(name)) {
    return interaction.reply({
      content: `⚠️ Reminder \`${name}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true
    })
  }

  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return interaction.reply({ content: "Format jam salah bestie. Contoh: `04:30`, `18:00`", ephemeral: true })
  }

  const [h, m] = timeStr.split(":").map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return interaction.reply({ content: `Jam \`${timeStr}\` gak valid. Hour 0–23, minute 0–59. fr 💀`, ephemeral: true })
  }

  const oldJam = (() => {
    if (BUILT_IN_KEYS.includes(name)) return fmt(config[name].hour, config[name].minute)
    return fmt(config.custom[name].hour, config.custom[name].minute)
  })()

  setTime(guildId, name, h, m)
  const updated = getConfig(guildId)
  const r       = BUILT_IN_KEYS.includes(name) ? updated[name] : updated.custom[name]

  return interaction.reply({
    content: `${r.emoji} Jam **${r.label}** diubah: \`${oldJam}\` → \`${fmt(h, m)}\` WIB. Catat!`
  })
}

async function handleAdd(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const key     = interaction.options.getString("key").toLowerCase().trim().replace(/\s+/g, "-")
  const label   = interaction.options.getString("label").trim()
  const timeStr = interaction.options.getString("jam")
  const emoji   = interaction.options.getString("emoji")?.trim() || "🔔"
  const guildId = interaction.guildId

  // Validasi key
  if (!/^[a-z0-9-]+$/.test(key)) {
    return interaction.reply({
      content: "Key harus huruf kecil, angka, atau tanda `-` aja. Contoh: `siang`, `break-sore`. fr 💀",
      ephemeral: true
    })
  }

  if (BUILT_IN_KEYS.includes(key)) {
    return interaction.reply({
      content: `\`${key}\` itu nama bawaan bot, gak bisa dipake. Coba nama lain.`,
      ephemeral: true
    })
  }

  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return interaction.reply({ content: "Format jam salah. Contoh: `12:00`, `15:30`", ephemeral: true })
  }

  const [h, m] = timeStr.split(":").map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return interaction.reply({ content: `Jam \`${timeStr}\` gak valid. Hour 0–23, minute 0–59.`, ephemeral: true })
  }

  const ok = addCustomReminder(guildId, key, { label, emoji, hour: h, minute: m })
  if (!ok) {
    return interaction.reply({
      content: `⚠️ Reminder \`${key}\` udah ada. Ganti nama key-nya.`,
      ephemeral: true
    })
  }

  return interaction.reply({
    content: [
      `${emoji} Custom reminder **${label}** (\`${key}\`) berhasil dibuat!`,
      `⏰ Jam: \`${fmt(h, m)}\` WIB  |  Status: ✅ ON`,
      ``,
      `Sekarang tambahin teks pesannya pakai:`,
      `\`/reminder add-text ${key} <teks pesan>\``,
      `_(Kalau belum ada teks, reminder gak bakal kekirim)_`,
    ].join("\n")
  })
}

async function handleDelete(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const key     = interaction.options.getString("key").toLowerCase().trim()
  const guildId = interaction.guildId

  if (BUILT_IN_KEYS.includes(key)) {
    return interaction.reply({
      content: `🔒 \`${key}\` adalah reminder bawaan dan gak bisa dihapus. Kalau mau dimatiin aja, pakai \`/reminder off ${key}\`.`,
      ephemeral: true
    })
  }

  const ok = deleteCustomReminder(guildId, key)
  if (!ok) {
    return interaction.reply({
      content: `⚠️ Custom reminder \`${key}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true
    })
  }

  return interaction.reply({
    content: `🗑️ Custom reminder \`${key}\` udah dihapus permanen. Gak bakal balik lagi.`
  })
}

async function handleAddText(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const name    = interaction.options.getString("nama").toLowerCase().trim()
  const text    = interaction.options.getString("teks").trim()
  const guildId = interaction.guildId
  const config  = getConfig(guildId)

  const allKeys = [...BUILT_IN_KEYS, ...Object.keys(config.custom || {})]
  if (!allKeys.includes(name)) {
    return interaction.reply({
      content: `⚠️ Reminder \`${name}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true
    })
  }

  const ok = addReminderText(guildId, name, text)
  if (!ok) {
    return interaction.reply({ content: "Gagal nambahin teks. Coba lagi.", ephemeral: true })
  }

  const updated  = getConfig(guildId)
  const messages = BUILT_IN_KEYS.includes(name) ? updated[name].messages : updated.custom[name].messages

  return interaction.reply({
    content: [
      `✅ Teks berhasil ditambah ke reminder **${name}**!`,
      `📝 \`${text}\``,
      ``,
      `Total teks sekarang: **${messages.length}** — pakai \`/reminder list-text ${name}\` buat lihat semua.`,
    ].join("\n")
  })
}

async function handleRemoveText(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const name    = interaction.options.getString("nama").toLowerCase().trim()
  const nomor   = interaction.options.getInteger("nomor")
  const guildId = interaction.guildId
  const config  = getConfig(guildId)

  const allKeys = [...BUILT_IN_KEYS, ...Object.keys(config.custom || {})]
  if (!allKeys.includes(name)) {
    return interaction.reply({
      content: `⚠️ Reminder \`${name}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true
    })
  }

  const result = removeReminderText(guildId, name, nomor)

  if (!result.ok) {
    if (result.reason === "out_of_range") {
      return interaction.reply({
        content: `⚠️ Nomor \`${nomor}\` gak valid. Reminder \`${name}\` punya **${result.total}** teks. Cek pakai \`/reminder list-text ${name}\`.`,
        ephemeral: true
      })
    }
    return interaction.reply({ content: "Gagal hapus teks. Coba lagi.", ephemeral: true })
  }

  return interaction.reply({
    content: [
      `🗑️ Teks nomor **${nomor}** dari reminder **${name}** udah dihapus.`,
      `📝 ~~${result.removed}~~`,
    ].join("\n")
  })
}

async function handleListText(interaction) {
  const name    = interaction.options.getString("nama").toLowerCase().trim()
  const guildId = interaction.guildId
  const config  = getConfig(guildId)

  const allKeys = [...BUILT_IN_KEYS, ...Object.keys(config.custom || {})]
  if (!allKeys.includes(name)) {
    return interaction.reply({
      content: `⚠️ Reminder \`${name}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true
    })
  }

  const r        = BUILT_IN_KEYS.includes(name) ? config[name] : config.custom[name]
  const messages = getMessages(config, name)
  const isDefault = BUILT_IN_KEYS.includes(name) && (config[name].messages || []).length === 0

  if (!messages.length) {
    return interaction.reply({
      content: `📭 Reminder **${name}** belum punya teks pesan. Tambah pakai \`/reminder add-text ${name} <teks>\`.`,
      ephemeral: true
    })
  }

  const rows = messages.map((t, i) => `\`${i + 1}.\` ${t}`).join("\n")
  const note = isDefault ? "\n_⚠️ Ini teks default bawaan bot. Tambah teks baru untuk override._" : ""

  return interaction.reply({
    embeds: [{
      color: 0x5865f2,
      title: `${r.emoji} Teks Reminder — ${r.label} (\`${name}\`)`,
      description: rows + note,
      footer: { text: `${messages.length} teks • Hapus pakai /reminder remove-text ${name} <nomor>` },
      timestamp: new Date().toISOString()
    }]
  })
}

async function handleReset(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)
  resetConfig(interaction.guildId)
  return interaction.reply({
    content: "🔄 Jadwal built-in di-reset ke default (jam & status). Custom reminder dan channel tetap gak berubah."
  })
}

// ── Main execute ──
async function execute(interaction) {
  const sub = interaction.options.getSubcommand()
  if (sub === "list")        return handleList(interaction)
  if (sub === "on")          return handleToggle(interaction, true)
  if (sub === "off")         return handleToggle(interaction, false)
  if (sub === "set-time")    return handleSetTime(interaction)
  if (sub === "add")         return handleAdd(interaction)
  if (sub === "delete")      return handleDelete(interaction)
  if (sub === "add-text")    return handleAddText(interaction)
  if (sub === "remove-text") return handleRemoveText(interaction)
  if (sub === "list-text")   return handleListText(interaction)
  if (sub === "reset")       return handleReset(interaction)
}

module.exports = { data, execute }