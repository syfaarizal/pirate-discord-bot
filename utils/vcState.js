const callerMap    = new Map()  // guildId → userId
const pendingLeave = new Map()  // guildId → timeoutId
const noticeChannelMap = new Map() // guildId -> text channel id

function setCaller(guildId, userId) {
  callerMap.set(guildId, userId)
}

function getCaller(guildId) {
  return callerMap.get(guildId) ?? null
}

function clearCaller(guildId) {
  callerMap.delete(guildId)
}

function setPendingLeave(guildId, timeoutId) {
  pendingLeave.set(guildId, timeoutId)
}

function cancelPendingLeave(guildId) {
  const t = pendingLeave.get(guildId)
  if (t) {
    clearTimeout(t)
    pendingLeave.delete(guildId)
    return true
  }
  return false
}

function hasPendingLeave(guildId) {
  return pendingLeave.has(guildId)
}

function setNoticeChannel(guildId, channelId) {
  if (!channelId) return
  noticeChannelMap.set(guildId, channelId)
}

function getNoticeChannel(guildId) {
  return noticeChannelMap.get(guildId) ?? null
}

function clearNoticeChannel(guildId) {
  noticeChannelMap.delete(guildId)
}

module.exports = {
  setCaller, getCaller, clearCaller,
  setPendingLeave, cancelPendingLeave, hasPendingLeave,
  setNoticeChannel, getNoticeChannel, clearNoticeChannel,
}