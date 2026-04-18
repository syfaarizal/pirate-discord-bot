// guildId → boolean (apakah bot lagi dengerin)
const listeningMap = new Map()

// guildId → string (trigger keyword, default "kichi")
const keywordMap = new Map()

// guildId → boolean (bot lagi ngomong / processing, jangan interrupt)
const speakingLock = new Map()

// guildId → AbortController (buat cancel listen loop kalau /listen off)
const abortMap = new Map()

// ── Listening ──
function setListening(guildId, val)  { listeningMap.set(guildId, val) }
function isListening(guildId)        { return listeningMap.get(guildId) === true }

// ── Keyword ──
function setKeyword(guildId, word)   { keywordMap.set(guildId, word.toLowerCase().trim()) }
function getKeyword(guildId)         { return keywordMap.get(guildId) ?? "kichi" }

// ── Speaking lock (bot lagi generate/play audio) ──
function setSpeaking(guildId, val)   { speakingLock.set(guildId, val) }
function isSpeaking(guildId)         { return speakingLock.get(guildId) === true }

// ── Abort controller (buat stop listen loop) ──
function setAbort(guildId, ctrl)     { abortMap.set(guildId, ctrl) }
function getAbort(guildId)           { return abortMap.get(guildId) ?? null }
function clearAbort(guildId) {
  const ctrl = abortMap.get(guildId)
  if (ctrl) { try { ctrl.abort() } catch {} abortMap.delete(guildId) }
}

// ── Cleanup semua state satu guild ──
function clearSession(guildId) {
  clearAbort(guildId)
  listeningMap.delete(guildId)
  speakingLock.delete(guildId)
  // keyword sengaja gak dihapus — persist per session
}

module.exports = {
  setListening, isListening,
  setKeyword, getKeyword,
  setSpeaking, isSpeaking,
  setAbort, getAbort, clearAbort,
  clearSession,
}