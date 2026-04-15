const callerMap    = new Map()  // guildId → userId
const pendingLeave = new Map()  // guildId → timeoutId
const movingFlag   = new Map()  // guildId → boolean

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

function setMoving(guildId) {
  movingFlag.set(guildId, true)
}

function clearMoving(guildId) {
  movingFlag.delete(guildId)
}

function isMoving(guildId) {
  return movingFlag.get(guildId) === true
}

module.exports = {
  setCaller, getCaller, clearCaller,
  setPendingLeave, cancelPendingLeave, hasPendingLeave,
  setMoving, clearMoving, isMoving,
}