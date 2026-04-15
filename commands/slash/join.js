const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")

// ── /join ──
const joinData = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Panggil Kichi ke voice channel lo sekarang")

// ── /leave ──
const leaveData = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Suruh Kichi keluar dari voice channel")

// ─────────────────────────────────────────────
// /join
// ─────────────────────────────────────────────

async function executeJoin(interaction) {
  const member  = interaction.member
  const guildId = interaction.guildId

  // 1. User harus udah di VC
  const userVC = member.voice?.channel
  if (!userVC) {
    return interaction.reply({
      content: "join voice dulu baru panggil gua 😐",
      ephemeral: true,
    })
  }

  // 2. Cek permission bot di VC user
  const permissions = userVC.permissionsFor(interaction.client.user)
  if (!permissions?.has(PermissionFlagsBits.Connect) || !permissions?.has(PermissionFlagsBits.Speak)) {
    return interaction.reply({
      content: `gua gak punya permission buat masuk ${userVC}. minta admin fix dulu.`,
      ephemeral: true,
    })
  }

  // 3. Cek apakah bot udah di VC di guild ini
  const existing = getVoiceConnection(guildId)
  if (existing) {
    const botChannelId = existing.joinConfig?.channelId

    // Udah di VC yang sama
    if (botChannelId === userVC.id) {
      return interaction.reply({
        content: `gua udah di ${userVC} dari tadi 😑`,
        ephemeral: true,
      })
    }

    // Di VC yang beda — tolak, harus /leave dulu atau pindah ke VC bot
    const botChannel = interaction.guild.channels.cache.get(botChannelId)
    return interaction.reply({
      content: `gua lagi di ${botChannel ?? "VC lain"} nih. \`/leave\` dulu atau masuk ke sana baru panggil lagi.`,
      ephemeral: true,
    })
  }

  // 4. Join
  try {
    joinVoiceChannel({
      channelId:      userVC.id,
      guildId:        guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf:       true,
      selfMute:       false,
    })

    return interaction.reply({
      content: `oke, gua di ${userVC} 👋`,
    })
  } catch (err) {
    console.error("[VC Join Error]", err)
    return interaction.reply({
      content: "gagal masuk VC, coba lagi.",
      ephemeral: true,
    })
  }
}

// ─────────────────────────────────────────────
// /leave
// ─────────────────────────────────────────────

async function executeLeave(interaction) {
  const connection = getVoiceConnection(interaction.guildId)

  if (!connection) {
    return interaction.reply({
      content: "gua lagi gak di VC mana-mana.",
      ephemeral: true,
    })
  }

  connection.destroy()
  return interaction.reply({
    content: "oke gua cabut 👋",
  })
}

module.exports = { joinData, leaveData, executeJoin, executeLeave }