const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")
const {
  getCaller, clearCaller, setCaller,
  setPendingLeave, cancelPendingLeave, hasPendingLeave,
  getNoticeChannel, clearNoticeChannel,
  setFreeMode, clearFreeMode, isFreeMode,
} = require("../utils/vcState")

const LEAVE_DELAY_MS = 60 * 1000  // 1 menit

// Helpers

function getBotChannelId(guildId) {
  return getVoiceConnection(guildId)?.joinConfig?.channelId ?? null
}

async function sendNotice(guild, guildId, text) {
  const channelId = getNoticeChannel(guildId)
  if (!channelId) return
  try {
    const ch = await guild.client.channels.fetch(channelId)
    if (!ch?.isTextBased() || ch.isThread()) return
    await ch.send(text)
  } catch { /* deleted / no access */ }
}

function doJoin(guild, guildId, targetChannel) {
  return joinVoiceChannel({
    channelId:      targetChannel.id,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf:       true,
    selfMute:       false,
  })
}

// Main handler

async function onVoiceStateUpdate(oldState, newState) {
  const guild   = newState.guild ?? oldState.guild
  const guildId = guild.id
  const client  = newState.client ?? oldState.client
  const botId   = client.user.id
  const userId  = newState.id ?? oldState.id

  if (userId === botId) return

  const connection = getVoiceConnection(guildId)
  if (!connection) return

  const callerId = getCaller(guildId)

  const botChannelId = getBotChannelId(guildId)


  if (isFreeMode(guildId)) {
    if (!oldState.channelId && newState.channelId === botChannelId) {
      clearFreeMode(guildId)
      setCaller(guildId, userId)
      cancelPendingLeave(guildId)
      console.log(`🎮 [VC] Free mode: controller baru ${userId} (${guildId})`)
      return
    }
  }

  if (
    userId === callerId &&
    newState.channelId &&                        // caller lagi di suatu channel
    newState.channelId !== botChannelId          // bukan channel bot sekarang
  ) {
    const targetChannel = newState.channel
    if (!targetChannel) return

    cancelPendingLeave(guildId)

    try {
      doJoin(guild, guildId, targetChannel)
      console.log(`🔀 [VC] Follow caller → "${targetChannel.name}" (${guildId})`)
    } catch (err) {
      console.error("[VC Follow Error]", err)
    }
    return
  }

  if (userId === callerId && oldState.channelId && !newState.channelId) {
    if (hasPendingLeave(guildId)) return

    console.log(`⏳ [VC] Caller leave — nunggu ${LEAVE_DELAY_MS / 1000}s (${guildId})`)

    const snapCallerId = callerId  // snapshot buat closure

    const timeoutId = setTimeout(async () => {
      const conn = getVoiceConnection(guildId)
      if (!conn) return

      cancelPendingLeave(guildId)

      const currentBotChId = getBotChannelId(guildId)
      const botCh          = guild.channels.cache.get(currentBotChId)
      const callerBack     = botCh?.members?.has(snapCallerId) ?? false

      if (callerBack) {
        console.log(`↩️ [VC] Caller balik sebelum timer habis (${guildId})`)
        return
      }

      const humanCount = botCh?.members?.filter(m => !m.user.bot).size ?? 0

      if (humanCount > 0) {
        clearCaller(guildId)
        setFreeMode(guildId)
        await sendNotice(guild, guildId, "mode bebas aktif. siapa yang manggil gua, gua ikut 😏")
        console.log(`🔓 [VC] Free mode aktif (${guildId})`)
      } else {
        await sendNotice(guild, guildId, "udah gak ada siapa-siapa. gua leave ya 👋")
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

  if (userId === callerId && !oldState.channelId && newState.channelId) {
    if (cancelPendingLeave(guildId)) {
      console.log(`↩️ [VC] Caller balik, timer dibatalin (${guildId})`)
    }
    return
  }

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

        cancelPendingLeave(guildId)

        if (count > 0) return

        await sendNotice(guild, guildId, "udah gak ada siapa-siapa. gua leave ya 👋")
        conn.destroy()
        clearCaller(guildId)
        clearFreeMode(guildId)
        clearNoticeChannel(guildId)
        console.log(`👋 [VC] Auto-leave — VC kosong (${guildId})`)
      }, LEAVE_DELAY_MS)

      setPendingLeave(guildId, timeoutId)
    }
    return
  }

  if (!oldState.channelId && newState.channelId === botChannelId) {
    if (cancelPendingLeave(guildId)) {
      console.log(`↩️ [VC] Ada yang join VC, timer dibatalin (${guildId})`)
    }
  }
}

module.exports = { onVoiceStateUpdate }