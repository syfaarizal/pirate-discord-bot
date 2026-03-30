const fs   = require("fs")
const path = require("path")

const CONFIG_PATH = path.join(__dirname, "../data/reminders.json")

// ── Reminder bawaan (tidak bisa dihapus, tapi bisa diubah jam/teks/status) ──
const REMINDER_DEFAULTS = {
  pagi:  { enabled: true, hour: 7,  minute: 0,  label: "Pagi",  emoji: "🌞", builtIn: true },
  siang: { enabled: true, hour: 12, minute: 0,  label: "Siang", emoji: "☀️", builtIn: true },
  malam: { enabled: true, hour: 21, minute: 0,  label: "Malam", emoji: "🌙", builtIn: true },
}

const BUILT_IN_KEYS   = Object.keys(REMINDER_DEFAULTS)
const VALID_REMINDERS = BUILT_IN_KEYS

// Default messages untuk built-in reminders
// Format quote pakai > biar keliatan kayak blockquote di Discord
const DEFAULT_MESSAGES = {
  pagi: [
    "pagi crue!! semangat ya hari ini, atau minimal pura-pura semangat dulu ☀️",
    "morning!! vibes hari ini harus bagus, no excuse 🌞",
    "selamat pagi~ jangan lupa sarapan, jangan skip 🫡",
    "rise and shine bestie. hari ini bakal slay, fr fr ☀️",
    "pagi pagi~ semoga harinya gak berat-berat amat ya, fighting!! 🌤",
    "gm! jangan lupa sarapan yeuuw, biar ga lemes 🍳",
    "morning eperibadeh!! selamat menjalani aktivitas, jangan lupa istirahat juga ya~ 🌻",
    "good morning!! jangan lupa senyum, walaupun cuma buat diri sendiri 😊",
    "ehm pagi. moga harinya ga berat-berat amat ya, kita jalanin aja dulu, one step at a time 🐾",
    "pagi~ yah, hari ini masih jomblo aja, tapi semoga harinya gak sepi-sepi amat ya wkwk 💀",
    "aduh, kasian gaada yang ngucapin, jadi gua aja yang ngucapin — selamat pagi!! semoga harinya menyenangkan, atau setidaknya ga terlalu nyebelin wkwkwk 🌞",
    "> \"The secret of getting ahead is getting started.\" — Mark Twain\npagi crue, yuk mulai hari ini pelan-pelan~ 🌤",
    "> \"You don't have to be great to start, but you have to start to be great.\" — Zig Ziglar\nselamat pagi!! hari ini bisa, fr 💪",
    "> \"Every morning is a chance at a new day.\" — Marjorie Pay Hinckley\ngm gm~ semoga hari ini lebih baik dari kemarin ya ✨",
    "> \"Morning is an important time of day, because how you spend your morning can often tell you what kind of day you are going to have.\" — Lemony Snicket\npagi bestie, awali harinya dengan baik ya~ 🌻",
    "> \"Rise up, start fresh, see the bright opportunity in each new day.\" — Unknown\nayo bangkit, hari baru nih!! jangan males-malesan mulu 😤☀️",
    "> \"Each morning we are born again. What we do today is what matters most.\" — Buddha\npagi~ inget, hari ini fresh start. gaskeun 🔥",
    "> \"An early-morning walk is a blessing for the whole day.\" — Henry David Thoreau\nselamat pagi crue!! semoga harinya penuh hal-hal baik 🌿",
  ],
  siang: [
    "siang crue!! udah makan belum? jangan skip makan siang, penting 🍱",
    "hei, istirahat dulu gapapa lho. otak juga butuh jeda~ ☕",
    "siang siang~ gimana pagi tadi? semoga lancar ya, lanjut semangat 💪",
    "lunch time!! tinggalin kerjaan sebentar, makan dulu yang bener 🍜",
    "oi, udah siang nih. kalau belum makan, makan dulu. jangan nunda-nunda 😤",
    "siang bestie~ jangan lupa minum air putih juga ya, bukan cuma kopi doang 💧",
    "recharge dulu~ makan siang yang cukup biar sore nya masih ada tenaga 🔋",
    "> \"Almost everything will work again if you unplug it for a few minutes, including you.\" — Anne Lamott\nsiang~ ambil napas dulu, istirahat sebentar gapapa ☕",
    "> \"Take care of your body. It's the only place you have to live.\" — Jim Rohn\nhei, udah makan? jangan lupa jaga badan ya, bukan cuma produktivitas doang 🍱",
    "> \"Nourishing yourself in a way that helps you blossom in the direction you want to go is attainable, and you are worth the effort.\" — Deborah Day\nmakan siang yuk~ tubuh lu butuh bahan bakar buat lanjut hari ini 🌻",
    "> \"You owe yourself the love that you so freely give to other people.\" — Unknown\nsiang crue~ jangan lupa treat yourself, minimal makan yang enak dikit 😌",
    "> \"Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.\" — Ralph Marston\nistirahat dulu sebentar ya~ produktif itu butuh jeda juga 💤",
    "> \"Eat well, travel often.\" — Unknown\nkalo belum makan, makan dulu. dunia bisa nunggu, perut enggak 💀🍜",
  ],
  malam: [
    "malem crue~ udah waktunya istirahat, jangan begadang mulu 🌙",
    "good night bestie!! besok masih ada hari baru, gak usah overthink 💤",
    "oke udah malem, yuk bobo. jangan yapping sampe subuh 😭🛌",
    "malam~ semoga istirahatnya enak dan mimpinya bagus fr 🌙",
    "gnight!! healing dulu, besok lanjut lagi 💤",
    "malem eperibadeh!! waktunya recharge, jangan lupa tidur yang cukup ya~ 🌙",
    "good night!! jangan lupa senyum sebelum tidur, biar mimpinya juga manis wkwk 😊",
    "ehm malam. hari ini mungkin berat, tapi besok masih ada kesempatan buat coba lagi 🌙",
    "hoamm~ udah malem nih. tidur gak sih lu? jangan yapping mulu 😴",
    "gn ngab, tidor ga lu? udah malem, jangan begadang mulu, besok masih ada hari baru 🌙",
    "gnight kesayangan~ semoga istirahatnya enak dan mimpinya bagus 💤",
    "> \"Sleep is the best meditation.\" — Dalai Lama\nmalem~ udah waktunya istirahat beneran, bukan scroll-scroll doang 😴",
    "> \"A good laugh and a long sleep are the best cures in the doctor's book.\" — Irish Proverb\ngnight crue!! tidur yang cukup ya, itu investasi buat besok 💤",
    "> \"Sleep is an investment in the energy you need to be effective tomorrow.\" — Tom Roth\nudah malem, yuk bobo. besok masih ada kerjaan, hari ini cukup 🛌",
    "> \"The night is the hardest time to be alive and 4am knows all my secrets.\" — Poppy Z. Brite\nei, kalau lagi susah tidur, gapapa. lu gak sendirian. tapi tetep coba istirahat ya 🌙",
    "> \"Each night, when I go to sleep, I die. And the next morning, when I wake up, I am reborn.\" — Mahatma Gandhi\nmalem~ hari ini udah selesai. besok kita mulai lagi, fresh 🌙✨",
    "> \"Finish each day and be done with it. You have done what you could.\" — Ralph Waldo Emerson\ngnight bestie~ hari ini udah cukup. istirahat, besok lanjut 💤",
    "> \"It is a common experience that a problem difficult at night is resolved in the morning after the committee of sleep has worked on it.\" — John Steinbeck\ntidur dulu~ kadang solusi dateng pas bangun tidur, bukan pas begadang 😴",
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

// ── Enable / disable (built-in & custom) ──
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

// ── Set time (built-in & custom) ──
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
  const all = loadAll()
  const channels = all[guildId]?.channels || []
  const custom   = all[guildId]?.custom   || {}
  all[guildId] = { channels, custom }
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