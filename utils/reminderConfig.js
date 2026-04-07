const fs   = require("fs")
const path = require("path")

const CONFIG_PATH = path.join(__dirname, "../data/reminders.json")

// ── Reminder bawaan (tidak bisa dihapus, tapi bisa diubah jam/teks/status) ──
const REMINDER_DEFAULTS = {
  pagi:  { enabled: true, hour: 7,  minute: 0,  label: "Pagi",  emoji: "🌅", builtIn: true },
  siang: { enabled: true, hour: 12, minute: 0,  label: "Siang", emoji: "☀️", builtIn: true },
  malam: { enabled: true, hour: 21, minute: 0,  label: "Malam", emoji: "🌙", builtIn: true },
}

const BUILT_IN_KEYS   = Object.keys(REMINDER_DEFAULTS)
const VALID_REMINDERS = BUILT_IN_KEYS

// ── Default messages ──
// Tone: pendek, hadir, gak maksa. Kebaca sekali lewat.
const DEFAULT_MESSAGES = {
  pagi: [
    "pagi~ pelan aja, yang penting mulai ☀️",
    "hari baru, versi lo yang baru juga",
    "gak harus sempurna, cukup jalan dulu",
    "tarik napas… gas pelan-pelan",
    "start kecil hari ini > nunggu perfect",
    "bangun, hidup masih nunggu lo jalanin",
    "gak usah ngebut, asal gak berhenti",
    "hari ini fresh start, jangan dibawa berat kemarin",
    "lo gak telat, lo lagi di timing lo sendiri",
    "ayo mulai, walau dikit",
    "good morning~ semoga ringan ya harinya",
    "fokus ke langkah pertama aja",
    "hidup gak lomba, santai tapi jalan",
    "satu progress kecil hari ini udah cukup",
    "mata udah kebuka, berarti ada kesempatan lagi",
  ],
  siang: [
    "udah makan belum? isi bensin dulu 😌",
    "jangan lupa minum, otak juga butuh cairan",
    "kalau capek, istirahat bentar gapapa",
    "hidup gak harus kejar-kejaran terus",
    "rehat sebentar bukan berarti kalah",
    "lagi berat? yaudah, jalan pelan aja",
    "jangan lupa, lo juga manusia",
    "santai bentar, dunia gak lari kok",
    "hari belum selesai, masih bisa dibenerin",
    "kalau overthinking, tarik napas dulu",
    "kerja penting, tapi diri lo juga",
    "jangan lupa makan yang enak dikit 😌",
    "pause sebentar, reset dikit",
    "capek itu valid, tapi jangan nyerah",
    "lo udah sejauh ini, lanjut dikit lagi",
  ],
  malam: [
    "malam… waktunya pelan-pelan berhenti 🌙",
    "hari ini cukup. gak harus sempurna",
    "istirahat dulu, besok lanjut lagi",
    "gak semua harus diselesaiin hari ini",
    "tidur dulu, biar pikiran ikut tenang",
    "lo udah berusaha hari ini, itu cukup",
    "kalau berat, taruh dulu… besok diambil lagi",
    "dunia bisa nunggu, tidur dulu 😴",
    "kadang jawaban datang setelah istirahat",
    "pelan-pelan lepasin yang bikin penuh",
    "besok masih ada kesempatan",
    "malam ini, izinin diri lo tenang",
    "gak apa-apa kalau hari ini gak maksimal",
    "tutup hari dengan tenang, bukan penyesalan",
    "good night~ semoga tidur lo nyenyak ✨",
  ],
}

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

// ── Build config satu guild ──
function buildGuildConfig(saved = {}) {
  const result = { channels: saved.channels || [] }
  for (const key of BUILT_IN_KEYS) {
    result[key] = {
      ...REMINDER_DEFAULTS[key],
      ...(saved[key] || {}),
      messages: saved[key]?.messages || [],
    }
  }
  result.custom = saved.custom || {}
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

// Ambil pesan aktual: kalau kosong pakai default bawaan
function getMessages(config, key) {
  if (config.custom?.[key]) {
    return config.custom[key].messages?.length > 0 ? config.custom[key].messages : []
  }
  const msgs = config[key]?.messages
  if (msgs && msgs.length > 0) return msgs
  return DEFAULT_MESSAGES[key] || []
}

// ── Channel management ──
function setChannel(guildId, channelId) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}
  const channels = all[guildId].channels || []
  if (!channels.includes(channelId)) channels.push(channelId)
  all[guildId].channels = channels
  saveAll(all)
}

function removeChannel(guildId, channelId) {
  const all = loadAll()
  if (!all[guildId]) return false
  const before = all[guildId].channels || []
  const after  = before.filter(id => id !== channelId)
  if (before.length === after.length) return false
  all[guildId].channels = after
  saveAll(all)
  return true
}

// ── Enable / disable ──
function setEnabled(guildId, key, enabled) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}

  if (BUILT_IN_KEYS.includes(key)) {
    if (!all[guildId][key]) all[guildId][key] = { ...REMINDER_DEFAULTS[key] }
    all[guildId][key].enabled = enabled
  } else {
    if (!all[guildId].custom?.[key]) return false
    all[guildId].custom[key].enabled = enabled
  }
  saveAll(all)
  return true
}

// ── Set time ──
function setTime(guildId, key, hour, minute) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}

  if (BUILT_IN_KEYS.includes(key)) {
    if (!all[guildId][key]) all[guildId][key] = { ...REMINDER_DEFAULTS[key] }
    all[guildId][key].hour   = hour
    all[guildId][key].minute = minute
  } else {
    if (!all[guildId].custom?.[key]) return false
    all[guildId].custom[key].hour   = hour
    all[guildId].custom[key].minute = minute
  }
  saveAll(all)
  return true
}

// ── Custom reminder CRUD ──
function addCustomReminder(guildId, key, { label, emoji, hour, minute }) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}
  if (!all[guildId].custom) all[guildId].custom = {}
  if (BUILT_IN_KEYS.includes(key) || all[guildId].custom[key]) return false

  all[guildId].custom[key] = {
    enabled:  true,
    hour,
    minute,
    label,
    emoji:    emoji || "🔔",
    messages: [],
  }
  saveAll(all)
  return true
}

function deleteCustomReminder(guildId, key) {
  const all = loadAll()
  if (!all[guildId]?.custom?.[key]) return false
  delete all[guildId].custom[key]
  saveAll(all)
  return true
}

// ── Message management ──
function addReminderText(guildId, key, text) {
  const all = loadAll()
  if (!all[guildId]) all[guildId] = {}

  if (BUILT_IN_KEYS.includes(key)) {
    if (!all[guildId][key]) all[guildId][key] = { ...REMINDER_DEFAULTS[key] }
    if (!all[guildId][key].messages) all[guildId][key].messages = []
    all[guildId][key].messages.push(text)
  } else {
    if (!all[guildId].custom?.[key]) return false
    if (!all[guildId].custom[key].messages) all[guildId].custom[key].messages = []
    all[guildId].custom[key].messages.push(text)
  }
  saveAll(all)
  return true
}

function removeReminderText(guildId, key, index) {
  const all = loadAll()
  if (!all[guildId]) return { ok: false, reason: "no_guild" }

  let messages
  if (BUILT_IN_KEYS.includes(key)) {
    if (!all[guildId][key]) all[guildId][key] = { ...REMINDER_DEFAULTS[key] }
    if (!all[guildId][key].messages || all[guildId][key].messages.length === 0) {
      all[guildId][key].messages = [...DEFAULT_MESSAGES[key]]
    }
    messages = all[guildId][key].messages
  } else {
    if (!all[guildId].custom?.[key]) return { ok: false, reason: "not_found" }
    messages = all[guildId].custom[key].messages
  }

  const i = index - 1
  if (i < 0 || i >= messages.length) return { ok: false, reason: "out_of_range", total: messages.length }

  const removed = messages.splice(i, 1)[0]
  saveAll(all)
  return { ok: true, removed }
}

function resetMessages(guildId, key) {
  const all = loadAll()
  if (!all[guildId]) return false

  if (BUILT_IN_KEYS.includes(key)) {
    if (all[guildId][key]) all[guildId][key].messages = []
  } else {
    if (!all[guildId].custom?.[key]) return false
    all[guildId].custom[key].messages = []
  }
  saveAll(all)
  return true
}

function resetConfig(guildId) {
  const all      = loadAll()
  const channels = all[guildId]?.channels || []
  const custom   = all[guildId]?.custom   || {}
  all[guildId]   = { channels, custom }
  saveAll(all)
}

function isValid(name) { return BUILT_IN_KEYS.includes(name) }

module.exports = {
  getConfig, getAllConfigs, getMessages,
  setChannel, removeChannel,
  setEnabled, setTime,
  addCustomReminder, deleteCustomReminder,
  addReminderText, removeReminderText, resetMessages,
  resetConfig, isValid,
  VALID_REMINDERS, BUILT_IN_KEYS, REMINDER_DEFAULTS, DEFAULT_MESSAGES,
}