const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const { setChannel, removeChannel, getConfig } = require("../../utils/reminderConfig")

const data = new SlashCommandBuilder()
  .setName("set-reminder-channel")
  .setDescription("Manage channel tujuan reminder otomatis — Admin/Mod only 🔒")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

  .addSubcommand(sub => sub
    .setName("add")
    .setDescription("Tambah channel untuk nerima reminder otomatis")
    .addChannelOption(opt => opt
      .setName("channel")
      .setDescription("Channel yang mau ditambah")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
    )
  )

  .addSubcommand(sub => sub
    .setName("remove")
    .setDescription("Lepas channel dari daftar penerima reminder")
    .addChannelOption(opt => opt
      .setName("channel")
      .setDescription("Channel yang mau dilepas")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
    )
  )

  .addSubcommand(sub => sub
    .setName("list")
    .setDescription("Lihat semua channel yang terdaftar sebagai penerima reminder")
  )

async function execute(interaction) {
  const sub     = interaction.options.getSubcommand()
  const guildId = interaction.guildId

  if (sub === "add") {
    const channel = interaction.options.getChannel("channel")
    setChannel(guildId, channel.id)
    return interaction.reply({
      content: `✅ ${channel} ditambahkan! Reminder bakal masuk ke sana mulai sekarang.\nPakai \`/reminder list\` buat cek jadwalnya.`,
    })
  }

  if (sub === "remove") {
    const channel = interaction.options.getChannel("channel")
    const removed = removeChannel(guildId, channel.id)

    if (!removed) {
      return interaction.reply({
        content: `⚠️ ${channel} gak ada di daftar. Cek dulu pakai \`/set-reminder-channel list\`.`,
        ephemeral: true
      })
    }

    const config      = getConfig(guildId)
    const sisaChannel = config.channels.length

    return interaction.reply({
      content: sisaChannel > 0
        ? `✅ ${channel} udah dilepas. Masih ada ${sisaChannel} channel lain yang aktif.`
        : `✅ ${channel} udah dilepas. Sekarang gak ada channel terdaftar — reminder gak bakal kekirim sampai lu tambah lagi.`,
    })
  }

  if (sub === "list") {
    const config   = getConfig(guildId)
    const channels = config.channels

    if (channels.length === 0) {
      return interaction.reply({
        content: "📭 Belum ada channel yang terdaftar. Pakai `/set-reminder-channel add` buat nambah.",
        ephemeral: true
      })
    }

    const list = channels.map((id, i) => `${i + 1}. <#${id}>`).join("\n")
    return interaction.reply({
      embeds: [{
        color: 0x5865f2,
        title: "📋 Channel Penerima Reminder",
        description: list,
        footer: { text: "Pirate Helper • Pakai /set-reminder-channel remove untuk lepas channel ⚓" },
        timestamp: new Date().toISOString()
      }]
    })
  }
}

module.exports = { data, execute }