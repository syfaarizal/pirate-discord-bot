const COOLDOWN_MS = 5000 // 5 detik per user

// Map userId -> timestamp terakhir request
const lastRequest = new Map()

function isOnCooldown(userId) {
  const last = lastRequest.get(userId)
  if (!last) return false
  return Date.now() - last < COOLDOWN_MS
}

function getRemainingCooldown(userId) {
  const last = lastRequest.get(userId)
  if (!last) return 0
  const remaining = COOLDOWN_MS - (Date.now() - last)
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

function setCooldown(userId) {
  lastRequest.set(userId, Date.now())
}

module.exports = { isOnCooldown, getRemainingCooldown, setCooldown }