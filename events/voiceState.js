const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")
const {
  getCaller, clearCaller,
  setPendingLeave, cancelPendingLeave, hasPendingLeave,
  getNoticeChannel, clearNoticeChannel,
} = require("../utils/vcState")

// Jeda sebelum auto-leave: random antara 30-60 detik
const LEAVE_DELAY_MIN = 30 * 1000
const LEAVE_DELAY_MAX = 60 * 1000

function randomDelay() {
  return Math.floor(Math.random() * (LEAVE_DELAY_MAX - LEAVE_DELAY_MIN + 1)) + LEAVE_DELAY_MIN
}

async function sendLeaveNotice(guild, guildId) {
  const noticeChannelId = getNoticeChannel(guildId)
  if (!noticeChannelId) return

  try {
    const channel = await guild.client.channels.fetch(noticeChannelId)
    if (!channel || !channel.isTextBased() || channel.isThread()) return
    await channel.send("udah gak ada siapa-siapa. gua leave ya 👋")
  } catch {
    // Channel bisa jadi udah dihapus / bot gak punya akses.
  }
}

async function onVoiceStateUpdate(oldState, newState) {
  const guild      = newState.guild ?? oldState.guild
  const guildId    = guild.id
  const client     = newState.client ?? oldState.client
  const botId      = client.user.id
  const connection = getVoiceConnection(guildId)

  // Bot gak di VC → skip
  if (!connection) return

  const botChannelId = connection.joinConfig?.channelId

  // Abaikan event yang dipicu oleh bot itu sendiri
  const isBot = (newState.id ?? oldState.id) === botId
  if (isBot) return

  const callerId = getCaller(guildId)
  const userId   = newState.id ?? oldState.id

  // CASE 1: Caller pindah channel (bukan leave)
  const callerMoved = (
    userId === callerId &&
    oldState.channelId === botChannelId &&
    newState.channelId &&
    newState.channelId !== botChannelId
  )

  if (callerMoved) {
    const targetChannel = newState.channel
    if (!targetChannel) return

    try {
      joinVoiceChannel({
        channelId:      targetChannel.id,
        guildId:        guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf:       true,
        selfMute:       false,
      })
      cancelPendingLeave(guildId)
      console.log(`🔀 [VC] Follow caller ke ${targetChannel.name} (${guildId})`)
    } catch (err) {
      console.error("[VC Follow Error]", err)
    }
    return
  }

  // CASE 2: Caller leave dari VC bot (bukan pindah)
  const callerLeft = (
    userId === callerId &&
    oldState.channelId === botChannelId &&
    !newState.channelId
  )

  if (callerLeft) {
    // Kalau udah ada timer, jangan bikin lagi
    if (hasPendingLeave(guildId)) return

    const delay = randomDelay()
    console.log(`⏳ [VC] Caller leave — pending leave dalam ${Math.round(delay / 1000)}s (${guildId})`)

    const timeoutId = setTimeout(async () => {
      // Re-check: kalau caller udah balik, jangan leave
      const conn = getVoiceConnection(guildId)
      if (!conn) return  // udah di-destroy duluan

      const botCh = guild.channels.cache.get(conn.joinConfig?.channelId)
      const callerBack = botCh?.members?.has(callerId)

      if (callerBack) {
        cancelPendingLeave(guildId)
        console.log(`↩️ [VC] Caller balik, pending leave dibatalin (${guildId})`)
        return
      }

      await sendLeaveNotice(guild, guildId)

      conn.destroy()
      clearCaller(guildId)
      clearNoticeChannel(guildId)
      cancelPendingLeave(guildId)
      console.log(`👋 [VC] Auto-leave setelah jeda (${guildId})`)
    }, delay)

    setPendingLeave(guildId, timeoutId)
    return
  }

  // CASE 3: Non-caller leave, tapi VC jadi kosong total
  const otherLeft = (
    oldState.channelId === botChannelId &&
    !newState.channelId
  )

  if (otherLeft) {
    const botChannel = guild.channels.cache.get(botChannelId)
    const humanCount = botChannel?.members?.filter(m => !m.user.bot).size ?? 0

    if (humanCount === 0 && !hasPendingLeave(guildId)) {
      const delay = randomDelay()
      console.log(`⏳ [VC] VC kosong — pending leave dalam ${Math.round(delay / 1000)}s (${guildId})`)

      const timeoutId = setTimeout(async () => {
        const conn = getVoiceConnection(guildId)
        if (!conn) return

        const ch    = guild.channels.cache.get(conn.joinConfig?.channelId)
        const count = ch?.members?.filter(m => !m.user.bot).size ?? 0
        if (count > 0) {
          cancelPendingLeave(guildId)
          return
        }

        await sendLeaveNotice(guild, guildId)

        conn.destroy()
        clearCaller(guildId)
        clearNoticeChannel(guildId)
        cancelPendingLeave(guildId)
        console.log(`👋 [VC] Auto-leave — VC kosong (${guildId})`)
      }, delay)

      setPendingLeave(guildId, timeoutId)
    }
    return
  }

  // CASE 4: User balik ke VC bot — cancel pending leave
  const userReturned = (
    !oldState.channelId &&
    newState.channelId === botChannelId
  )

  if (userReturned && hasPendingLeave(guildId)) {
    cancelPendingLeave(guildId)
    console.log(`↩️ [VC] User balik ke VC, pending leave dibatalin (${guildId})`)
  }
}

module.exports = { onVoiceStateUpdate }