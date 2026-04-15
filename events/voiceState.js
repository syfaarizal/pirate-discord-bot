const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")
const {
  getCaller, clearCaller,
  setPendingLeave, cancelPendingLeave, hasPendingLeave,
  getNoticeChannel, clearNoticeChannel,
  setFreeMode, clearFreeMode, isFreeMode,
} = require("../utils/vcState")

const LEAVE_DELAY_MS   = 60 * 1000   // 1 menit sebelum free mode aktif / leave
const FREE_MODE_MSG    = "mode bebas aktif. siapa yang manggil gua, gua ikut 😏"
const LEAVE_MSG        = "udah gak ada siapa-siapa. gua leave ya 👋"

// Helpers

async function sendNotice(guild, guildId, text) {
  const channelId = getNoticeChannel(guildId)
  if (!channelId) return
  try {
    const ch = await guild.client.channels.fetch(channelId)
    if (!ch?.isTextBased() || ch.isThread()) return
    await ch.send(text)
  } catch { /* channel dihapus / no access, skip */ }
}

function doJoin(guild, guildId, targetChannel) {
  joinVoiceChannel({
    channelId:      targetChannel.id,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf:       true,
    selfMute:       false,
  })
}

// Ambil current bot channel id langsung dari connection — selalu fresh
function getBotChannelId(guildId) {
  return getVoiceConnection(guildId)?.joinConfig?.channelId ?? null
}

// Main event handler

async function onVoiceStateUpdate(oldState, newState) {
  const guild    = newState.guild ?? oldState.guild
  const guildId  = guild.id
  const client   = newState.client ?? oldState.client
  const botId    = client.user.id
  const userId   = newState.id ?? oldState.id

  if (userId === botId) return

  const connection = getVoiceConnection(guildId)
  if (!connection) return

  const botChannelId = getBotChannelId(guildId)
  const callerId     = getCaller(guildId)
  const freeMode     = isFreeMode(guildId)


  // FREE MODE: siapapun yang join VC bot jadi controller baru

  if (freeMode && newState.channelId === botChannelId && !oldState.channelId) {
    const { setCaller } = require('../utils/vcState')
    clearFreeMode(guildId)
    setCaller(guildId, userId)
    cancelPendingLeave(guildId)
    console.log(`🎮 [VC] Controller baru di free mode: ${userId} (${guildId})`)
    return
  }

  if (userId === callerId && newState.channelId && newState.channelId !== botChannelId) {
    const targetChannel = newState.channel
    if (!targetChannel) return

    cancelPendingLeave(guildId)

    try {
      doJoin(guild, guildId, targetChannel)
      console.log(`🔀 [VC] Follow caller ke "${targetChannel.name}" (${guildId})`)
    } catch (err) {
      console.error("[VC Follow Error]", err)
    }
    return
  }


  // CASE 2: Caller leave (disconnect total, bukan pindah)

  if (userId === callerId && oldState.channelId && !newState.channelId) {
    if (hasPendingLeave(guildId)) return  // timer udah jalan

    console.log(`⏳ [VC] Caller leave — nunggu ${LEAVE_DELAY_MS / 1000}s (${guildId})`)

    const timeoutId = setTimeout(async () => {
      const conn = getVoiceConnection(guildId)
      if (!conn) return

      const currentBotChId = getBotChannelId(guildId)
      const botCh          = guild.channels.cache.get(currentBotChId)
      const humanCount     = botCh?.members?.filter(m => !m.user.bot).size ?? 0

      cancelPendingLeave(guildId)

      if (humanCount > 0) {
        // Masih ada orang di VC → free mode
        clearCaller(guildId)
        setFreeMode(guildId)
        await sendNotice(guild, guildId, FREE_MODE_MSG)
        console.log(`🔓 [VC] Free mode aktif (${guildId})`)
      } else {
        // VC kosong → leave
        await sendNotice(guild, guildId, LEAVE_MSG)
        conn.destroy()
        clearCaller(guildId)
        clearFreeMode(guildId)
        clearNoticeChannel(guildId)
        console.log(`👋 [VC] Auto-leave — caller pergi, VC kosong (${guildId})`)
      }
    }, LEAVE_DELAY_MS)

    setPendingLeave(guildId, timeoutId)
    return
  }


  // CASE 3: Caller balik ke VC bot sebelum timer habis

  if (userId === callerId && newState.channelId === botChannelId && !oldState.channelId) {
    if (cancelPendingLeave(guildId)) {
      console.log(`↩️ [VC] Caller balik, timer dibatalin (${guildId})`)
    }
    return
  }


  // CASE 4: Non-caller leave — cek kalau VC jadi kosong (free mode atau normal)

  if (oldState.channelId === botChannelId && !newState.channelId) {
    const botCh      = guild.channels.cache.get(botChannelId)
    const humanCount = botCh?.members?.filter(m => !m.user.bot).size ?? 0

    if (humanCount === 0 && !hasPendingLeave(guildId)) {
      console.log(`⏳ [VC] VC kosong — nunggu ${LEAVE_DELAY_MS / 1000}s (${guildId})`)

      const timeoutId = setTimeout(async () => {
        const conn = getVoiceConnection(guildId)
        if (!conn) return

        const ch    = guild.channels.cache.get(getBotChannelId(guildId))
        const count = ch?.members?.filter(m => !m.user.bot).size ?? 0
        if (count > 0) { cancelPendingLeave(guildId); return }

        await sendNotice(guild, guildId, LEAVE_MSG)
        conn.destroy()
        clearCaller(guildId)
        clearFreeMode(guildId)
        clearNoticeChannel(guildId)
        cancelPendingLeave(guildId)
        console.log(`👋 [VC] Auto-leave — VC kosong (${guildId})`)
      }, LEAVE_DELAY_MS)

      setPendingLeave(guildId, timeoutId)
    }
    return
  }


  // CASE 5: Ada yang balik ke VC bot — cancel pending leave

  if (!oldState.channelId && newState.channelId === botChannelId) {
    if (cancelPendingLeave(guildId)) {
      console.log(`↩️ [VC] Ada yang balik ke VC, timer dibatalin (${guildId})`)
    }
  }
}

module.exports = { onVoiceStateUpdate }