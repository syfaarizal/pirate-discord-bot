const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")
const {
  setCaller, getCaller, clearCaller,
  cancelPendingLeave,
  setNoticeChannel, clearNoticeChannel,
  setFreeMode, clearFreeMode, isFreeMode,
} = require("../../utils/vcState")

// ── /join ──
const joinData = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Panggil Kichi ke voice channel sekarang")

// ── /leave ──
const leaveData = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Suruh Kichi keluar dari voice channel")

// /join

async function executeJoin(interaction) {
  const member  = interaction.member
  const guildId = interaction.guildId
  const userId  = interaction.user.id

  // 1. User harus udah di VC
  const userVC = member.voice?.channel
  if (!userVC) {
    return interaction.reply({
      content: "join voice dulu baru panggil gua 😐",
      ephemeral: true,
    })
  }

  const existing = getVoiceConnection(guildId)


  // FREE MODE: bot udah di VC, siapapun bisa ambil alih sebagai controller

  if (existing && isFreeMode(guildId)) {
    const botChannelId = existing.joinConfig?.channelId

    // Kalau user di VC yang sama dengan bot
    if (userVC.id === botChannelId) {
      cancelPendingLeave(guildId)
      clearFreeMode(guildId)
      setCaller(guildId, userId)
      setNoticeChannel(guildId, interaction.channelId)
      return interaction.reply({
        content: `siap, gua ikutin lo sekarang ${userVC} 🫡`,
      })
    }

    // User di VC lain → bot pindah ke sana, set sebagai controller
    const permissions = userVC.permissionsFor(interaction.client.user)
    if (!permissions?.has(PermissionFlagsBits.Connect) || !permissions?.has(PermissionFlagsBits.Speak)) {
      return interaction.reply({
        content: `gua gak punya permission buat masuk ${userVC}.`,
        ephemeral: true,
      })
    }

    try {
      joinVoiceChannel({
        channelId:      userVC.id,
        guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf:       true,
        selfMute:       false,
      })
      cancelPendingLeave(guildId)
      clearFreeMode(guildId)
      setCaller(guildId, userId)
      setNoticeChannel(guildId, interaction.channelId)
      return interaction.reply({
        content: `oke gua pindah ke ${userVC}, lo jadi controller sekarang 🫡`,
      })
    } catch (err) {
      console.error("[VC FreeMode Join Error]", err)
      return interaction.reply({ content: "gagal pindah VC, coba lagi.", ephemeral: true })
    }
  }

  // NORMAL MODE: bot belum di VC
  if (existing) {
    const botChannelId = existing.joinConfig?.channelId

    if (botChannelId === userVC.id) {
      return interaction.reply({
        content: `gua udah di ${userVC} dari tadi 😑`,
        ephemeral: true,
      })
    }

    const botChannel = interaction.guild.channels.cache.get(botChannelId)
    return interaction.reply({
      content: `gua lagi di ${botChannel ?? "VC lain"} nih. \`/leave\` dulu atau masuk ke sana.`,
      ephemeral: true,
    })
  }

  // Cek permission
  const permissions = userVC.permissionsFor(interaction.client.user)
  if (!permissions?.has(PermissionFlagsBits.Connect) || !permissions?.has(PermissionFlagsBits.Speak)) {
    return interaction.reply({
      content: `gua gak punya permission buat masuk ${userVC}. minta admin fix dulu.`,
      ephemeral: true,
    })
  }

  // Cancel pending + clear free mode (just in case)
  cancelPendingLeave(guildId)
  clearFreeMode(guildId)

  try {
    joinVoiceChannel({
      channelId:      userVC.id,
      guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf:       true,
      selfMute:       false,
    })

    setCaller(guildId, userId)
    setNoticeChannel(guildId, interaction.channelId)

    return interaction.reply({ content: `oke, gua di ${userVC} 👋` })
  } catch (err) {
    console.error("[VC Join Error]", err)
    return interaction.reply({ content: "gagal masuk VC, coba lagi.", ephemeral: true })
  }
}

// /leave

async function executeLeave(interaction) {
  const guildId  = interaction.guildId
  const userId   = interaction.user.id
  const member   = interaction.member
  const callerId = getCaller(guildId)

  const connection = getVoiceConnection(guildId)
  if (!connection) {
    return interaction.reply({ content: "gua lagi gak di VC mana-mana.", ephemeral: true })
  }

  // Di free mode, siapapun boleh /leave
  const inFreeMode = isFreeMode(guildId)

  const isAdminOrMod = member && (
    member.guild.ownerId === userId ||
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.roles.cache.some(r => {
      const n = r.name.toLowerCase()
      return n.includes("admin") || n.includes("mod")
    })
  )
  const isCaller = callerId === userId

  if (!inFreeMode && !isCaller && !isAdminOrMod) {
    return interaction.reply({
      content: "yang bisa nyuruh gua pergi itu yang manggil gua, atau admin/mod. bukan lu 😐",
      ephemeral: true,
    })
  }

  cancelPendingLeave(guildId)
  connection.destroy()
  clearCaller(guildId)
  clearFreeMode(guildId)
  clearNoticeChannel(guildId)

  return interaction.reply({ content: "oke gua cabut, bye 👋" })
}

module.exports = { joinData, leaveData, executeJoin, executeLeave }