const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js")

const {
  getConfig, getMessages,
  setEnabled, setTime, resetConfig,
  addCustomReminder, deleteCustomReminder,
  addReminderText, removeReminderText,
  setChannel, removeChannel,
  BUILT_IN_KEYS, REMINDER_DEFAULTS,
} = require("../../utils/reminderConfig")

// Helpers

function fmt(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

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
    content: "🔒 Command ini khusus Admin/Moderator.",
    ephemeral: true,
  })
}

function parseTime(timeStr) {
  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) return null
  const [h, m] = timeStr.split(":").map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

function getAllReminderEntries(config) {
  const entries = BUILT_IN_KEYS.map(key => ({ key, ...config[key], isBuiltIn: true }))
  for (const [key, r] of Object.entries(config.custom || {})) {
    entries.push({ key, ...r, isBuiltIn: false })
  }
  return entries
}

// Command Definition

const data = new SlashCommandBuilder()
  .setName("reminder")
  .setDescription("Manage jadwal reminder otomatis server ini")

  // ── Public ──
  .addSubcommand(sub => sub
    .setName("list")
    .setDescription("Lihat semua jadwal reminder + statusnya")
  )

  // ── Admin: Create ──
  .addSubcommand(sub => sub
    .setName("create")
    .setDescription("Buat custom reminder baru 🔒")
    .addStringOption(opt => opt
      .setName("key")
      .setDescription("ID unik (huruf kecil, tanpa spasi — contoh: sore, break-siang)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("label")
      .setDescription("Nama tampilan (contoh: Break Sore)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("jam")
      .setDescription("Jam kirim, format HH:MM (contoh: 15:30)")
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName("emoji")
      .setDescription("Emoji reminder (opsional, default: 🔔)")
      .setRequired(false)
    )
  )

  // ── Admin: Edit (2-step: select → modal) ──
  .addSubcommand(sub => sub
    .setName("edit")
    .setDescription("Edit reminder — pilih reminder lalu pilih aksi 🔒")
  )

  // ── Admin: Delete ──
  .addSubcommand(sub => sub
    .setName("delete")
    .setDescription("Hapus custom reminder 🔒")
    .addStringOption(opt => opt
      .setName("key")
      .setDescription("Key custom reminder yang mau dihapus")
      .setRequired(true)
    )
  )

  // ── Admin: Channel management ──
  .addSubcommandGroup(group => group
    .setName("channel")
    .setDescription("Manage channel tujuan reminder 🔒")
    .addSubcommand(sub => sub
      .setName("add")
      .setDescription("Tambah channel penerima reminder")
      .addChannelOption(opt => opt
        .setName("channel")
        .setDescription("Channel yang mau ditambah")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
    )
    .addSubcommand(sub => sub
      .setName("remove")
      .setDescription("Lepas channel dari daftar penerima")
      .addChannelOption(opt => opt
        .setName("channel")
        .setDescription("Channel yang mau dilepas")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
    )
    .addSubcommand(sub => sub
      .setName("list")
      .setDescription("Lihat semua channel yang terdaftar")
    )
  )

// /reminder list

async function handleList(interaction) {
  const config    = getConfig(interaction.guildId)
  const guildName = interaction.guild?.name || interaction.guildId

  const builtInRows = BUILT_IN_KEYS.map(key => {
    const r        = config[key]
    const status   = r.enabled ? "✅" : "❌"
    const jam      = fmt(r.hour, r.minute)
    const defJam   = fmt(REMINDER_DEFAULTS[key].hour, REMINDER_DEFAULTS[key].minute)
    const modified = jam !== defJam ? " *(custom)*" : ""
    const count    = getMessages(config, key).length
    return `${r.emoji} \`${key.padEnd(10)}\` ${status} \`${jam}\`${modified} _(${count} teks)_`
  }).join("\n")

  const customEntries = Object.entries(config.custom || {})
  const customRows = customEntries.length > 0
    ? customEntries.map(([key, r]) => {
        const status = r.enabled ? "✅" : "❌"
        const count  = (r.messages || []).length
        return `${r.emoji} \`${key.padEnd(10)}\` ${status} \`${fmt(r.hour, r.minute)}\` _(${count} teks)_`
      }).join("\n")
    : "_Belum ada. Pakai `/reminder create` untuk buat baru._"

  const channelCount = config.channels.length
  const channelInfo  = channelCount > 0
    ? `${channelCount} channel terdaftar — lihat: \`/reminder channel list\``
    : "⚠️ Belum ada channel! Pakai `/reminder channel add` dulu."

  return interaction.reply({
    embeds: [{
      color: 0x5865f2,
      title: `⏰ Reminder Schedule — ${guildName}`,
      fields: [
        { name: "Built-in", value: builtInRows },
        { name: "Custom",   value: customRows },
        { name: "📢 Channel Tujuan", value: channelInfo },
        { name: "Admin/Mod 🔒", value: [
          "`/reminder create` — buat custom reminder",
          "`/reminder edit` — edit jadwal, teks, atau toggle",
          "`/reminder delete <key>` — hapus custom reminder",
          "`/reminder channel add/remove/list` — manage channel",
        ].join("\n") },
      ],
      footer: { text: "Pirate Helper • Config per server ⚓" },
      timestamp: new Date().toISOString(),
    }],
  })
}

// /reminder create

async function handleCreate(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const key     = interaction.options.getString("key").toLowerCase().trim().replace(/\s+/g, "-")
  const label   = interaction.options.getString("label").trim()
  const timeStr = interaction.options.getString("jam")
  const emoji   = interaction.options.getString("emoji")?.trim() || "🔔"
  const guildId = interaction.guildId

  if (!/^[a-z0-9-]+$/.test(key)) {
    return interaction.reply({
      content: "Key harus huruf kecil, angka, atau `-` aja. Contoh: `sore`, `break-siang`.",
      ephemeral: true,
    })
  }

  if (BUILT_IN_KEYS.includes(key)) {
    return interaction.reply({
      content: `\`${key}\` adalah nama bawaan bot. Pakai nama lain.`,
      ephemeral: true,
    })
  }

  const time = parseTime(timeStr)
  if (!time) {
    return interaction.reply({
      content: "Format jam salah. Contoh valid: `12:00`, `15:30`.",
      ephemeral: true,
    })
  }

  const ok = addCustomReminder(guildId, key, { label, emoji, hour: time.h, minute: time.m })
  if (!ok) {
    return interaction.reply({
      content: `⚠️ Reminder \`${key}\` udah ada. Ganti nama key-nya.`,
      ephemeral: true,
    })
  }

  return interaction.reply({
    content: [
      `${emoji} Custom reminder **${label}** (\`${key}\`) berhasil dibuat!`,
      `⏰ Jam: \`${fmt(time.h, time.m)}\` WIB  |  Status: ✅ ON`,
      ``,
      `Sekarang tambahin teks pesannya lewat \`/reminder edit\` → pilih \`${key}\` → **Tambah Teks**.`,
      `_(Tanpa teks, reminder gak bakal kekirim)_`,
    ].join("\n"),
  })
}

// /reminder edit — Step 1: Select Menu

async function handleEdit(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const config  = getConfig(interaction.guildId)
  const entries = getAllReminderEntries(config)

  if (entries.length === 0) {
    return interaction.reply({
      content: "Belum ada reminder. Buat dulu pakai `/reminder create`.",
      ephemeral: true,
    })
  }

  const options = entries.map(r => ({
    label:       `${r.emoji} ${r.label} (${r.key})`,
    description: `⏰ ${fmt(r.hour, r.minute)} WIB  •  ${r.enabled ? "✅ ON" : "❌ OFF"}`,
    value:       r.key,
  }))

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("reminder_edit_select")
      .setPlaceholder("Pilih reminder yang mau diedit...")
      .addOptions(options)
  )

  return interaction.reply({
    content: "**Step 1/2** — Pilih reminder mana yang mau diedit:",
    components: [row],
    ephemeral: true,
  })
}

// /reminder edit — Step 2: Action Buttons
// (dipanggil dari interactionCreate setelah select menu)

async function handleEditSelectMenu(interaction) {
  const selectedKey = interaction.values[0]
  const config      = getConfig(interaction.guildId)
  const isBuiltIn   = BUILT_IN_KEYS.includes(selectedKey)
  const r           = isBuiltIn ? config[selectedKey] : config.custom?.[selectedKey]

  if (!r) {
    return interaction.update({
      content: "⚠️ Reminder gak ketemu. Mungkin udah dihapus.",
      components: [],
    })
  }

  const toggleLabel = r.enabled ? "❌ Matiin" : "✅ Aktifin"
  const toggleStyle = r.enabled ? ButtonStyle.Danger : ButtonStyle.Success

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reminder_toggle:${selectedKey}`)
      .setLabel(toggleLabel)
      .setStyle(toggleStyle),
    new ButtonBuilder()
      .setCustomId(`reminder_settime:${selectedKey}`)
      .setLabel("⏰ Ubah Jam")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`reminder_addtext:${selectedKey}`)
      .setLabel("➕ Tambah Teks")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`reminder_removetext:${selectedKey}`)
      .setLabel("🗑️ Hapus Teks")
      .setStyle(ButtonStyle.Secondary),
  )

  const msgCount = getMessages(config, selectedKey).length

  return interaction.update({
    content: [
      `**Step 2/2** — \`${selectedKey}\` — ${r.emoji} **${r.label}**`,
      `⏰ \`${fmt(r.hour, r.minute)}\` WIB  •  ${r.enabled ? "✅ ON" : "❌ OFF"}  •  ${msgCount} teks`,
    ].join("\n"),
    components: [row],
  })
}

// Button Handlers (dipanggil dari interactionCreate)

async function handleToggleButton(interaction, key) {
  const config    = getConfig(interaction.guildId)
  const isBuiltIn = BUILT_IN_KEYS.includes(key)
  const r         = isBuiltIn ? config[key] : config.custom?.[key]
  if (!r) return interaction.reply({ content: "Reminder gak ketemu.", ephemeral: true })

  const newState = !r.enabled
  setEnabled(interaction.guildId, key, newState)

  return interaction.reply({
    content: newState
      ? `${r.emoji} **${r.label}** ✅ ON — bakal nge-ping jam \`${fmt(r.hour, r.minute)}\` WIB.`
      : `${r.emoji} **${r.label}** ❌ OFF — gak bakal ganggu lagi.`,
    ephemeral: true,
  })
}

async function handleSetTimeModal(interaction, key) {
  const modal = new ModalBuilder()
    .setCustomId(`reminder_settime_submit:${key}`)
    .setTitle(`Ubah Jam — ${key}`)

  const input = new TextInputBuilder()
    .setCustomId("jam")
    .setLabel("Jam baru (format HH:MM, contoh: 07:30)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("07:30")
    .setRequired(true)
    .setMaxLength(5)

  modal.addComponents(new ActionRowBuilder().addComponents(input))
  return interaction.showModal(modal)
}

async function handleSetTimeSubmit(interaction, key) {
  const timeStr = interaction.fields.getTextInputValue("jam").trim()
  const time    = parseTime(timeStr)

  if (!time) {
    return interaction.reply({
      content: `Format jam \`${timeStr}\` gak valid. Contoh: \`07:30\`, \`21:00\`.`,
      ephemeral: true,
    })
  }

  const config    = getConfig(interaction.guildId)
  const isBuiltIn = BUILT_IN_KEYS.includes(key)
  const r         = isBuiltIn ? config[key] : config.custom?.[key]
  if (!r) return interaction.reply({ content: "Reminder gak ketemu.", ephemeral: true })

  const oldJam = fmt(r.hour, r.minute)
  setTime(interaction.guildId, key, time.h, time.m)

  return interaction.reply({
    content: `${r.emoji} **${r.label}** — jam diubah: \`${oldJam}\` → \`${fmt(time.h, time.m)}\` WIB ✅`,
    ephemeral: true,
  })
}

async function handleAddTextModal(interaction, key) {
  const modal = new ModalBuilder()
    .setCustomId(`reminder_addtext_submit:${key}`)
    .setTitle(`Tambah Teks — ${key}`)

  const input = new TextInputBuilder()
    .setCustomId("teks")
    .setLabel("Teks pesan (maks 500 karakter)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("pagi crue!! semangat ya hari ini ☀️")
    .setRequired(true)
    .setMaxLength(500)

  modal.addComponents(new ActionRowBuilder().addComponents(input))
  return interaction.showModal(modal)
}

async function handleAddTextSubmit(interaction, key) {
  const text   = interaction.fields.getTextInputValue("teks").trim()
  const config = getConfig(interaction.guildId)
  const allKeys = [...BUILT_IN_KEYS, ...Object.keys(config.custom || {})]

  if (!allKeys.includes(key)) {
    return interaction.reply({ content: `Reminder \`${key}\` gak ketemu.`, ephemeral: true })
  }

  const ok = addReminderText(interaction.guildId, key, text)
  if (!ok) return interaction.reply({ content: "Gagal nambahin teks.", ephemeral: true })

  const updated  = getConfig(interaction.guildId)
  const isBuiltIn = BUILT_IN_KEYS.includes(key)
  const msgs     = isBuiltIn ? (updated[key].messages || []) : (updated.custom?.[key]?.messages || [])

  return interaction.reply({
    content: [
      `✅ Teks berhasil ditambah ke reminder **${key}**!`,
      `📝 \`${text}\``,
      `Total teks sekarang: **${msgs.length}**`,
    ].join("\n"),
    ephemeral: true,
  })
}

async function handleRemoveTextModal(interaction, key) {
  const config    = getConfig(interaction.guildId)
  const messages  = getMessages(config, key)

  if (!messages.length) {
    return interaction.reply({
      content: `📭 Reminder **${key}** belum punya teks. Tambah dulu.`,
      ephemeral: true,
    })
  }

  // Tampilkan daftar teks dulu, lalu minta nomor via modal
  const preview = messages
    .slice(0, 10)
    .map((t, i) => `\`${i + 1}.\` ${t.length > 80 ? t.slice(0, 80) + "..." : t}`)
    .join("\n")

  const modal = new ModalBuilder()
    .setCustomId(`reminder_removetext_submit:${key}`)
    .setTitle(`Hapus Teks — ${key}`)

  const listInput = new TextInputBuilder()
    .setCustomId("daftar")
    .setLabel("Teks yang ada (read-only, jangan diubah)")
    .setStyle(TextInputStyle.Paragraph)
    .setValue(preview)
    .setRequired(false)

  const nomorInput = new TextInputBuilder()
    .setCustomId("nomor")
    .setLabel(`Nomor teks yang mau dihapus (1–${messages.length})`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("1")
    .setRequired(true)
    .setMaxLength(3)

  modal.addComponents(
    new ActionRowBuilder().addComponents(listInput),
    new ActionRowBuilder().addComponents(nomorInput),
  )
  return interaction.showModal(modal)
}

async function handleRemoveTextSubmit(interaction, key) {
  const nomorStr = interaction.fields.getTextInputValue("nomor").trim()
  const nomor    = parseInt(nomorStr, 10)

  if (isNaN(nomor) || nomor < 1) {
    return interaction.reply({ content: `Nomor \`${nomorStr}\` gak valid.`, ephemeral: true })
  }

  const result = removeReminderText(interaction.guildId, key, nomor)

  if (!result.ok) {
    if (result.reason === "out_of_range") {
      return interaction.reply({
        content: `⚠️ Nomor \`${nomor}\` kelewat. Reminder **${key}** punya **${result.total}** teks.`,
        ephemeral: true,
      })
    }
    return interaction.reply({ content: "Gagal hapus teks.", ephemeral: true })
  }

  return interaction.reply({
    content: `🗑️ Teks nomor **${nomor}** dari **${key}** udah dihapus.\n~~${result.removed}~~`,
    ephemeral: true,
  })
}

// /reminder delete

async function handleDelete(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const key     = interaction.options.getString("key").toLowerCase().trim()
  const guildId = interaction.guildId

  if (BUILT_IN_KEYS.includes(key)) {
    return interaction.reply({
      content: `🔒 \`${key}\` adalah reminder bawaan dan gak bisa dihapus. Pakai \`/reminder edit\` → toggle OFF kalau mau dimatiin.`,
      ephemeral: true,
    })
  }

  const ok = deleteCustomReminder(guildId, key)
  if (!ok) {
    return interaction.reply({
      content: `⚠️ Custom reminder \`${key}\` gak ketemu. Cek daftar pakai \`/reminder list\`.`,
      ephemeral: true,
    })
  }

  return interaction.reply({
    content: `🗑️ Custom reminder \`${key}\` udah dihapus permanen.`,
  })
}

// /reminder channel

async function handleChannel(interaction) {
  if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

  const sub     = interaction.options.getSubcommand()
  const guildId = interaction.guildId

  if (sub === "add") {
    const channel = interaction.options.getChannel("channel")
    setChannel(guildId, channel.id)
    return interaction.reply({
      content: `✅ ${channel} ditambahkan! Reminder bakal masuk ke sana.\nPakai \`/reminder list\` buat cek jadwalnya.`,
    })
  }

  if (sub === "remove") {
    const channel = interaction.options.getChannel("channel")
    const removed = removeChannel(guildId, channel.id)

    if (!removed) {
      return interaction.reply({
        content: `⚠️ ${channel} gak ada di daftar. Cek dulu pakai \`/reminder channel list\`.`,
        ephemeral: true,
      })
    }

    const config      = getConfig(guildId)
    const sisaChannel = config.channels.length
    return interaction.reply({
      content: sisaChannel > 0
        ? `✅ ${channel} dilepas. Masih ada ${sisaChannel} channel aktif.`
        : `✅ ${channel} dilepas. Sekarang gak ada channel terdaftar — reminder gak kekirim sampai lu tambah lagi.`,
    })
  }

  if (sub === "list") {
    const config   = getConfig(guildId)
    const channels = config.channels

    if (channels.length === 0) {
      return interaction.reply({
        content: "📭 Belum ada channel terdaftar. Pakai `/reminder channel add` buat nambah.",
        ephemeral: true,
      })
    }

    const list = channels.map((id, i) => `${i + 1}. <#${id}>`).join("\n")
    return interaction.reply({
      embeds: [{
        color: 0x5865f2,
        title: "📋 Channel Penerima Reminder",
        description: list,
        footer: { text: "Pirate Helper ⚓" },
        timestamp: new Date().toISOString(),
      }],
    })
  }
}

// Main execute

async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false)
  const sub   = interaction.options.getSubcommand()

  if (group === "channel") return handleChannel(interaction)

  if (sub === "list")   return handleList(interaction)
  if (sub === "create") return handleCreate(interaction)
  if (sub === "edit")   return handleEdit(interaction)
  if (sub === "delete") return handleDelete(interaction)
}

module.exports = {
  data,
  execute,
  // Export handlers untuk interactionCreate
  handleEditSelectMenu,
  handleToggleButton,
  handleSetTimeModal,
  handleSetTimeSubmit,
  handleAddTextModal,
  handleAddTextSubmit,
  handleRemoveTextModal,
  handleRemoveTextSubmit,
}