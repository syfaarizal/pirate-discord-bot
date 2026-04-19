const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice")

const { getCaller }                     = require("../../utils/vcState")
const { textToSpeech, cleanupTempFile } = require("../../utils/tts")

// ─────────────────────────────────────────────
// Command definitions
// ─────────────────────────────────────────────

const speakData = new SlashCommandBuilder()
  .setName("speak")
  .setDescription("Kichi ngomong di VC")
  .addStringOption(opt => opt
    .setName("pesan")
    .setDescription("Teks yang mau diucapin Kichi")
    .setRequired(false)
    .setMaxLength(300)
  )

// ─────────────────────────────────────────────
// Core: play audio file di VC
// ─────────────────────────────────────────────

function playAudio(connection, filePath) {
  return new Promise((resolve, reject) => {
    const player   = createAudioPlayer()
    const resource = createAudioResource(filePath)

    connection.subscribe(player)
    player.play(resource)

    player.once(AudioPlayerStatus.Idle,  () => resolve())
    player.once("error", err => reject(err))

    // Safety timeout 30 detik
    setTimeout(() => resolve(), 30_000)
  })
}

// ─────────────────────────────────────────────
// /speak handler
// ─────────────────────────────────────────────

async function executeSpeak(interaction) {
  const guildId    = interaction.guildId
  const userId     = interaction.user.id
  const callerId   = getCaller(guildId)
  const connection = getVoiceConnection(guildId)

  // Bot harus di VC dulu
  if (!connection) {
    return interaction.reply({
      content: "gua gak di VC. `/join` dulu.",
      ephemeral: true,
    })
  }

  // Hanya caller
  if (userId !== callerId) {
    return interaction.reply({
      content: "cuma yang manggil gua yang bisa nyuruh gua ngomong.",
      ephemeral: true,
    })
  }

  // Ambil teks — kalau kosong pakai sapaan default
  const username = interaction.member?.displayName
    || interaction.user.globalName
    || interaction.user.username

  const teks = interaction.options.getString("pesan")
    || `Halo ${username}, nice to meet you. How are you?`

  await interaction.reply({ content: `🔊 oke...`, ephemeral: true })

  let tmpFile = null
  try {
    tmpFile = await textToSpeech(teks)
    await playAudio(connection, tmpFile)
  } catch (err) {
    console.error("[Speak Error]", err)
    await interaction.followUp({
      content: `gagal ngomong: ${err.message}`,
      ephemeral: true,
    })
  } finally {
    if (tmpFile) cleanupTempFile(tmpFile)
  }
}

module.exports = { speakData, executeSpeak }