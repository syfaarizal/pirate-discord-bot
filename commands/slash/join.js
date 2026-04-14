const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js")
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice")

// ── /join ──
const joinData = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Kichi masuk ke voice channel")
  .addChannelOption(opt => opt
    .setName("channel")
    .setDescription("Voice channel yang mau dimasukin")
    .addChannelTypes(ChannelType.GuildVoice)
    .setRequired(true)
  )

// ── /leave ──
const leaveData = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Kichi keluar dari voice channel")

// ── Handlers ──
async function executeJoin(interaction) {
  const channel = interaction.options.getChannel("channel")
  const guildId = interaction.guildId

  // Cek bot punya permission masuk VC itu
  const permissions = channel.permissionsFor(interaction.client.user)
  if (!permissions?.has(PermissionFlagsBits.Connect) || !permissions?.has(PermissionFlagsBits.Speak)) {
    return interaction.reply({
      content: `gua gak punya permission buat masuk ${channel}. minta admin tambahin dulu ya.`,
      ephemeral: true,
    })
  }

  // Kalau udah connect di guild ini, disconnect dulu sebelum pindah
  const existing = getVoiceConnection(guildId)
  if (existing) existing.destroy()

  try {
    joinVoiceChannel({
      channelId:      channel.id,
      guildId:        guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf:       true,   // bot deaf by default, gak perlu denger apapun sekarang
      selfMute:       false,  // unmute, siap buat TTS nanti
    })

    return interaction.reply({
      content: `oke, gua di ${channel} sekarang 👋`,
    })
  } catch (err) {
    console.error("[VC Join Error]", err)
    return interaction.reply({
      content: "gagal masuk VC nih, coba lagi.",
      ephemeral: true,
    })
  }
}

async function executeLeave(interaction) {
  const guildId    = interaction.guildId
  const connection = getVoiceConnection(guildId)

  if (!connection) {
    return interaction.reply({
      content: "gua lagi gak di VC mana-mana kok.",
      ephemeral: true,
    })
  }

  connection.destroy()
  return interaction.reply({
    content: "oke gua cabut dulu 👋",
  })
}

module.exports = { joinData, leaveData, executeJoin, executeLeave }