const fs = require("fs")
const path = require("path")

const CONFIG_PATH = path.join(__dirname, "../data/reminders.json")

const DEFAULTS = {
  sahur:      { enabled: true,  hour: 3,  minute: 30, label: "Sahur",       emoji: "🌙" },
  subuh:      { enabled: true,  hour: 4,  minute: 45, label: "Habis Subuh", emoji: "😴" },
  pagi:       { enabled: true,  hour: 7,  minute: 0,  label: "Pagi",        emoji: "🌞" },
  siang:      { enabled: true,  hour: 12, minute: 0,  label: "Siang",       emoji: "😴" },
  ngabuburit: { enabled: true,  hour: 16, minute: 30, label: "Ngabuburit",  emoji: "🌤" },
  buka:       { enabled: true,  hour: 18, minute: 0,  label: "Buka Puasa",  emoji: "🌇" },
  malam:      { enabled: true,  hour: 21, minute: 0,  label: "Malam",       emoji: "🌙" },
  tidur:      { enabled: true,  hour: 23, minute: 30, label: "Tidur",       emoji: "😴" },
}

const VALID_REMINDERS = Object.keys(DEFAULTS)

function ensureDataDir() {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadAllConfigs() {
  try {
    ensureDataDir()
    if (!fs.existsSync(CONFIG_PATH)) return {}
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
  } catch (err) {
    console.error("⚠️ Gagal load reminder config:", err.message)
    return {}
  }
}

function saveAllConfigs(all) {
  try {
    ensureDataDir()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(all, null, 2), "utf-8")
  } catch (err) {
    console.error("⚠️ Gagal save reminder config:", err.message)
  }
}

function getConfig(guildId) {
  const all = loadAllConfigs()
  const saved = all[guildId] || {}

  const merged = {}
  for (const key of VALID_REMINDERS) {
    merged[key] = { ...DEFAULTS[key], ...(saved[key] || {}) }
  }
  return merged
}

function getAllConfigs() {
  const all = loadAllConfigs()
  const result = {}
  for (const [guildId, saved] of Object.entries(all)) {
    const merged = {}
    for (const key of VALID_REMINDERS) {
      merged[key] = { ...DEFAULTS[key], ...(saved[key] || {}) }
    }
    result[guildId] = merged
  }
  return result
}

function setEnabled(guildId, name, enabled) {
  const all = loadAllConfigs()
  if (!all[guildId]) all[guildId] = {}
  if (!all[guildId][name]) all[guildId][name] = { ...DEFAULTS[name] }
  all[guildId][name].enabled = enabled
  saveAllConfigs(all)
  return true
}

function setTime(guildId, name, hour, minute) {
  const all = loadAllConfigs()
  if (!all[guildId]) all[guildId] = {}
  if (!all[guildId][name]) all[guildId][name] = { ...DEFAULTS[name] }
  all[guildId][name].hour = hour
  all[guildId][name].minute = minute
  saveAllConfigs(all)
  return true
}

/** Reset satu guild ke default. */
function resetConfig(guildId) {
  const all = loadAllConfigs()
  delete all[guildId]
  saveAllConfigs(all)
}

function isValid(name) {
  return VALID_REMINDERS.includes(name)
}

module.exports = {
  getConfig,
  getAllConfigs,
  setEnabled,
  setTime,
  resetConfig,
  isValid,
  VALID_REMINDERS,
  DEFAULTS
}