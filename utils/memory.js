const MAX_HISTORY = 20

// Map userId -> [{ role, content }]
const userMemory = new Map()

// Map userId -> { name, firstSeen, messageCount }
const userProfiles = new Map()

function getHistory(userId) {
  if (!userMemory.has(userId)) {
    userMemory.set(userId, [])
  }
  return userMemory.get(userId)
}

function addMessage(userId, role, content) {
  const history = getHistory(userId)
  history.push({ role, content })

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY)
  }
}

function getProfile(userId) {
  return userProfiles.get(userId) || null
}

function upsertProfile(userId, username) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      name: username,
      firstSeen: new Date().toISOString(),
      messageCount: 0
    })
  }

  const profile = userProfiles.get(userId)
  profile.name = username
  profile.messageCount += 1
  return profile
}

function clearHistory(userId) {
  userMemory.set(userId, [])
}

module.exports = { getHistory, addMessage, getProfile, upsertProfile, clearHistory }