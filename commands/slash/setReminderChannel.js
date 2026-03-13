const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const { setChannel } = require("../../utils/reminderConfig")

const data = new SlashCommandBuilder()
  .setName("set-reminder-channel")
  .setDescription("Set channel yang bakal nerima semua reminder otomatis — Admin/Mod only 🔒")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(opt => opt
    .setName("channel")
    .setDescription("Channel tujuan reminder")
    .addChannelTypes(ChannelType.GuildText)
    .setRequired(true)
  )

async function execute(interaction) {
  const channel = interaction.options.getChannel("channel")
  setChannel(interaction.guildId, channel.id)

  return interaction.reply({
    content: `✅ Siap! Semua reminder bakal dikirim ke ${channel} dari sekarang.\nPakai \`/reminder list\` buat lihat jadwalnya.`,
  })
}

module.exports = { data, execute }