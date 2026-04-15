const callerMap        = new Map()  // guildId → userId
const pendingLeave     = new Map()  // guildId → timeoutId
const noticeChannelMap = new Map()  // guildId → text channelId
const freeModeMap      = new Map()  // guildId → boolean

// ── Caller ──
function setCaller(guildId, userId) { callerMap.set(guildId, userId) }
function getCaller(guildId)         { return callerMap.get(guildId) ?? null }
function clearCaller(guildId)       { callerMap.delete(guildId) }

// ── Pending leave timer ──
function setPendingLeave(guildId, timeoutId) { pendingLeave.set(guildId, timeoutId) }
function hasPendingLeave(guildId)            { return pendingLeave.has(guildId) }
function cancelPendingLeave(guildId) {
  const t = pendingLeave.get(guildId)
  if (t) { clearTimeout(t); pendingLeave.delete(guildId); return true }
  return false
}

// ── Notice channel (channel teks tempat /join dipanggil) ──
function setNoticeChannel(guildId, channelId) { if (channelId) noticeChannelMap.set(guildId, channelId) }
function getNoticeChannel(guildId)            { return noticeChannelMap.get(guildId) ?? null }
function clearNoticeChannel(guildId)          { noticeChannelMap.delete(guildId) }

// ── Free mode (gak ada controller, siapapun bisa jadi controller baru) ──
function setFreeMode(guildId)   { freeModeMap.set(guildId, true) }
function clearFreeMode(guildId) { freeModeMap.delete(guildId) }
function isFreeMode(guildId)    { return freeModeMap.get(guildId) === true }

module.exports = {
  setCaller, getCaller, clearCaller,
  setPendingLeave, cancelPendingLeave, hasPendingLeave,
  setNoticeChannel, getNoticeChannel, clearNoticeChannel,
  setFreeMode, clearFreeMode, isFreeMode,
}