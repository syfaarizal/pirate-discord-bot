const fs   = require("fs")
const path = require("path")

const CONFIG_PATH = path.join(__dirname, "../data/reminders.json")

const REMINDER_DEFAULTS = {
  sahur:      { enabled: true,  hour: 3,  minute: 30, label: "Sahur",       emoji: "🌙" },
  subuh:      { enabled: true,  hour: 4,  minute: 45, label: "Habis Subuh", emoji: "😴" },
  pagi:       { enabled: true,  hour: 7,  minute: 0,  label: "Pagi",        emoji: "🌞" },
  siang:      { enabled: true,  hour: 12, minute: 0,  label: "Siang",       emoji: "😴" },
  ngabuburit: { enabled: true,  hour: 16, minute: 30, label: "Ngabuburit",  emoji: "🌤" },
  buka:       { enabled: true,  hour: 18, minute: 0,  label: "Buka Puasa",  emoji: "🌇" },
  malam:      { enabled: true,  hour: 21, minute: 0,  label: "Malam",       emoji: "🌙" },
  tidur:      { enabled: true,  hour: 23, minute: 30, label: "Tidur",       emoji: "😴" },
}

const VALID_REMINDERS = Object.keys(REMINDER_DEFAULTS)

// ── File I/O ──
function ensureDir() {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadAll() {
  try {
    ensureDir()
    if (!fs.existsSync(CONFIG_PATH)) return {}
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
  } catch (err) {
    console.error("⚠️ Gagal load config:", err.message)
    return {}
  }
}

function saveAll(data) {
  try {
    ensureDir()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.error("⚠️ Gagal save config:", err.message)
  }
}

// ── Build config satu guild (merge saved + defaults) ──
function buildGuildConfig(saved = {}) {
  const result = { channels: saved.channels || [] }
  for (const key of VALID_REMINDERS) {
    result[key] = { ...REMINDER_DEFAULTS[key], ...(saved[key] || {}) }
  }
  return result
}

// ── Public API ──
function getConfig(guildId) {
  return buildGuildConfig(loadAll()[guildId] || {})
}

function getAllConfigs() {
  const all = loadAll()
  const result = {}
  for (const [guildId, saved] of Object.entries(all)) {
    result[guildId] = buildGuildConfig(saved)
  }
  return result
}

function setChannel(guildId, channelId) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}
  all[guildId].channels = [channelId]
  saveAll(all)
}

function setEnabled(guildId, name, enabled) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}
  if (!all[guildId][name]) all[guildId][name] = { ...REMINDER_DEFAULTS[name] }
  all[guildId][name].enabled = enabled
  saveAll(all)
}

function setTime(guildId, name, hour, minute) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}
  if (!all[guildId][name]) all[guildId][name] = { ...REMINDER_DEFAULTS[name] }
  all[guildId][name].hour   = hour
  all[guildId][name].minute = minute
  saveAll(all)
}

function resetConfig(guildId) {
  const all = loadAll()
  const channels = all[guildId]?.channels || []
  all[guildId] = { channels }   // hapus reminder settings, simpan channel
  saveAll(all)
}

function isValid(name) { return VALID_REMINDERS.includes(name) }

module.exports = {
  getConfig, getAllConfigs,
  setChannel, setEnabled, setTime, resetConfig, isValid,
  VALID_REMINDERS, REMINDER_DEFAULTS
}