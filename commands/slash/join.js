const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")
const {
  setCaller,
  getCaller,
  clearCaller,
  cancelPendingLeave,
  setNoticeChannel,
  clearNoticeChannel,
} = require("../../utils/vcState")

// ── /join ──
const joinData = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Panggil Kichi ke voice channel sekarang")

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
  const userId  = interaction.user.id

  // 1. User harus udah di VC
  const userVC = member.voice?.channel
  if (!userVC) {
    return interaction.reply({
      content: "join voice dulu baru panggil gua napa bang 😐",
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
        content: `gua udah di ${userVC} dari tadi kocak 😑`,
        ephemeral: true,
      })
    }

    // Di VC yang beda — tolak
    const botChannel = interaction.guild.channels.cache.get(botChannelId)
    return interaction.reply({
      content: `gua lagi di ${botChannel ?? "VC lain"} nih.`,
      ephemeral: true,
    })
  }

  // 4. Cancel pending leave kalau ada (user manggil lagi sebelum timer habis)
  cancelPendingLeave(guildId)

  // 5. Join & simpan siapa yang manggil
  try {
    joinVoiceChannel({
      channelId:      userVC.id,
      guildId:        guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf:       true,
      selfMute:       false,
    })

    setCaller(guildId, userId)
    setNoticeChannel(guildId, interaction.channelId)

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
  const guildId  = interaction.guildId
  const userId   = interaction.user.id
  const member   = interaction.member
  const callerId = getCaller(guildId)

  const connection = getVoiceConnection(guildId)
  if (!connection) {
    return interaction.reply({
      content: "gua lagi gak di VC mana-mana sih...",
      ephemeral: true,
    })
  }

  // Cek permission: hanya caller atau admin/mod yang bisa /leave
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

  if (!isCaller && !isAdminOrMod) {
    return interaction.reply({
      content: "eits, yang bisa nyuruh gua pergi itu yang manggil gua, atau admin/mod. bukan lu 😐",
      ephemeral: true,
    })
  }

  // Cancel pending leave timer kalau ada
  cancelPendingLeave(guildId)

  connection.destroy()
  clearCaller(guildId)
  clearNoticeChannel(guildId)

  return interaction.reply({
    content: "oke gua cabut dulu, bye",
  })
}

module.exports = { joinData, leaveData, executeJoin, executeLeave }