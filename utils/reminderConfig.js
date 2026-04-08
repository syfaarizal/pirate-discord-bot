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
    "pagi, sayang~ pelan aja, yang penting mulai ☀️",
    "gm~ hari baru, versi kamu yang baru juga. jangan lupa sarapan yaa",
    "morning, sayang~ gak harus sempurna hari ini, cukup jalanin dulu",
    "gm gm! tarik napas… mulai pelan-pelan. jangan lupa minum air putih yaa",
    "morning morning~ start kecil hari ini > nunggu perfect",
    "yuk bangun, hidup masih nunggu di jalanin lho",
    "gm, sayang. pagi ini gak usah ngebut, asal gak berhenti. semangat yaa",
    "morning! hari ini fresh start, jangan dibawa ya berat yang kemarin",
    "gm, baby~ kamu gak telat ko, kamu lagi di timing kamu sendiri. yuk mulai dengan langkah kecil hari ini",
    "good morning, sayang~ ayo mulai, walau dikit. jangan lupa senyum yaa",
    "good morning~ semoga ringan ya harinya. jangan lupa senyum~",
    "morning, kesayangan~ fokus ke langkah pertama aja ya, sisanya nanti ikutin",
    "gm, sayang~ hidup gak lomba kok, santai aja tapi tetep jalan yaa",
    "pagi, sayangkuu~ satu progress kecil hari ini udah cukup kok. selamat menjalani hari yaa",
    "morning, kamuu~ kalau mata udah kebuka, berarti ada kesempatan lagi, yuk manfaatin",
  ],
  siang: [
    "siang~ udah makan belum? kalau belum, makan dulu ya ☀️",
    "halo! jangan lupa minum, otak juga butuh cairan lho",
    "selamat siang, sayang~ kalau capek, istirahat bentar gapapa kok",
    "met ciang~ hidup gak harus kejar-kejaran terus, sekarang rest dulu yaa",
    "selamat siang! istirahat sebentar bukan berarti kalah, tapi biar bisa lanjut dengan lebih baik",
    "hai, siang ini lagi berat? yaudah, jalan pelan aja ya. yang penting gak berhenti",
    "siangg~ jangan lupa minum air ya, sayang. biar gak dehidrasi",
    "met ciangg~ santai bentar yuk, dunia gak lari kok",
    "siangg~ hari belum selesai, masih ada waktu buat progress, tapi istirahat dulu gapapa",
    "siang, sayang~ kalau overthinking, tarik napas dulu ya, jangan biarin pikiran yang pegang kendali",
    "met ciang~ kerja penting, tapi diri kamu juga, rest dulu bentar gapapa kok",
    "happy lunch! jangan lupa makan yang enak dikit 😌",
    "siangg! pause sebentar, reset dikit, biar capeknya ga numpuk terus",
    "siang sayang~ capek itu valid, tapi jangan nyerah yaa",
    "siangg~ wahh kamu udah sejauh ini, lanjut dikit lagi ya, tapi kalau capek banget, istirahat dulu gapapa kok",
  ],
  malam: [
    "gn, babe~ udah capek ya? istirahat dulu, besok lanjut lagi",
    "gn~ hari ini cukup. gak harus sempurna kok. proud of you!",
    "malam~ istirahat dulu, besok lanjut lagi",
    "goodnight~ gak semua harus diselesaiin hari ini kok, tidur dulu yuk",
    "good night~ tidur dulu yuk, biar pikiran ikut tenang",
    "met malemm~ kamu udah berusaha hari ini, itu cukup kok. proud of you!",
    "malemm~ hari ini mungkin berat, tapi kamu udah jalanin, itu keren banget. sekarang istirahat dulu ya",
    "malem sayang~ gimana hari ini? apapun yang terjadi, kamu udah berusaha, itu keren banget. sekarang waktunya istirahat dulu yaa",
    "gn, sayang~ gak perlu cari jawaban sekarang, kadang jawaban datang setelah istirahat. selamat malam, semoga mimpi indah yaa",
    "good night~ hari ini mungkin belum sesuai harapan, tapi besok masih ada kesempatan buat coba lagi",
    "good night~ kamu udah berusaha hari ini, itu sudah kerenn. sekarang waktunya istirahat, biar besok bisa mulai lagi sama energi baru",
    "gn~ malemm, kamu udah jalanin hari ini, sekarang izinin diri kamu tenang. selamat tidur~",
    "hey, udah malem. gapapa kok kalau hari ini gak maksimal, yang penting kamu udah berusaha. proud of you!",
    "jangan overthinking malem-malem ya, sayang~ istirahat dulu, biar besok bisa lihat semuanya dengan pikiran yang lebih jernih",
    "hoamm~ hari ini mungkin belum sesuai harapan, tapi besok masih ada kesempatan buat coba lagi. good night, semoga mimpi indah ya, sayang ✨",
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