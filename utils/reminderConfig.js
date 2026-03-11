const fs = require("fs")
const path = require("path")

const CONFIG_PATH = path.join(__dirname, "../data/reminders.json")

// ─────────────────────────────────────
// Default config semua reminder
// ─────────────────────────────────────
const DEFAULTS = {
  sahur:      { enabled: true,  hour: 3,  minute: 30, label: "Sahur",      emoji: "🌙" },
  subuh:      { enabled: true,  hour: 4,  minute: 45, label: "Habis Subuh", emoji: "😴" },
  pagi:       { enabled: true,  hour: 7,  minute: 0,  label: "Pagi",       emoji: "🌞" },
  siang:      { enabled: true,  hour: 12, minute: 0,  label: "Siang",      emoji: "😴" },
  ngabuburit: { enabled: true,  hour: 16, minute: 30, label: "Ngabuburit", emoji: "🌤" },
  buka:       { enabled: true,  hour: 18, minute: 0,  label: "Buka Puasa", emoji: "🌇" },
  malam:      { enabled: true,  hour: 21, minute: 0,  label: "Malam",      emoji: "🌙" },
  tidur:      { enabled: true,  hour: 23, minute: 30, label: "Tidur",      emoji: "😴" },
}

// List nama reminder yang valid
const VALID_REMINDERS = Object.keys(DEFAULTS)

// ─────────────────────────────────────
// Load / Save config ke file
// ─────────────────────────────────────

function ensureDataDir() {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadConfig() {
  try {
    ensureDataDir()
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULTS)
      return JSON.parse(JSON.stringify(DEFAULTS)) // deep copy
    }
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    const saved = JSON.parse(raw)

    const merged = {}
    for (const key of VALID_REMINDERS) {
      merged[key] = { ...DEFAULTS[key], ...(saved[key] || {}) }
    }
    return merged
  } catch (err) {
    console.error("⚠️ Gagal load reminder config, pakai default:", err.message)
    return JSON.parse(JSON.stringify(DEFAULTS))
  }
}

function saveConfig(config) {
  try {
    ensureDataDir()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
  } catch (err) {
    console.error("⚠️ Gagal save reminder config:", err.message)
  }
}

function getConfig() {
  return loadConfig()
}

function setEnabled(name, enabled) {
  const config = loadConfig()
  if (!config[name]) return false
  config[name].enabled = enabled
  saveConfig(config)
  return true
}

function setTime(name, hour, minute) {
  const config = loadConfig()
  if (!config[name]) return false
  config[name].hour = hour
  config[name].minute = minute
  saveConfig(config)
  return true
}

function isValid(name) {
  return VALID_REMINDERS.includes(name)
}

module.exports = {
  getConfig,
  setEnabled,
  setTime,
  isValid,
  VALID_REMINDERS,
  DEFAULTS
}