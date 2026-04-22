const { searchGenius }    = require("./providers/genius")
const { getLyricsOvh }    = require("./providers/lyricsOvh")
const { getLyricsLrclib } = require("./providers/lrclib")

// ─────────────────────────────────────────────
// In-memory cache (TTL 6 jam)
// ─────────────────────────────────────────────

const cache      = new Map()   // key → { data, expiresAt }
const inFlight   = new Map()   // key → Promise (dedup concurrent requests)
const CACHE_TTL  = 6 * 60 * 60 * 1000

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.data
}

function cacheSet(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL })
  // Bersihkan cache lama kalau udah > 200 entry
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0]
    if (oldest) cache.delete(oldest[0])
  }
}

// ─────────────────────────────────────────────
// Normalize query
// ─────────────────────────────────────────────

function normalizeQuery(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, "")   // hapus parenthesis
    .replace(/\[.*?\]/g, "")   // hapus bracket
    .replace(/feat\.?\s+\S+/gi, "") // hapus feat
    .replace(/\s+/g, " ")
    .trim()
}

function buildCacheKey(artist, title) {
  return `${normalizeQuery(artist)}::${normalizeQuery(title)}`
}

// ─────────────────────────────────────────────
// Core: fetch lirik dengan fallback chain
// ─────────────────────────────────────────────

async function fetchLyricsWithFallback(artist, title) {
  const key = buildCacheKey(artist, title)

  // Cache hit
  const cached = cacheGet(key)
  if (cached) return { ...cached, fromCache: true }

  // Dedup concurrent requests untuk lagu yang sama
  if (inFlight.has(key)) return inFlight.get(key)

  const promise = (async () => {
    let lyrics  = null
    let source  = null
    let warning = false

    // Provider 1: Lyrics.ovh
    try {
      lyrics = await getLyricsOvh(artist, title)
      if (lyrics) source = "lyrics.ovh"
    } catch { /* skip */ }

    // Provider 2: LRCLIB (fallback)
    if (!lyrics) {
      try {
        lyrics = await getLyricsLrclib(artist, title)
        if (lyrics) source = "lrclib.net"
      } catch { /* skip */ }
    }

    // Kalau lirik terlalu pendek (< 100 char), anggap incomplete
    if (lyrics && lyrics.length < 100) {
      warning = true
    }

    const result = { lyrics, source, warning }
    if (lyrics) cacheSet(key, result)
    return result
  })()

  inFlight.set(key, promise)
  promise.finally(() => inFlight.delete(key))

  return promise
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Main entry point — search + fetch lyrics
 * @param {string} queryInput  raw query dari user
 * @param {string} [artistHint] artis dari user (opsional)
 * @returns {Promise<{
 *   title: string, artist: string, thumbnail: string|null,
 *   lyrics: string|null, source: string|null,
 *   warning: boolean, fromCache: boolean,
 *   geniusUrl: string|null
 * }>}
 */
async function getLyrics(queryInput, artistHint = "") {
  const query = artistHint
    ? `${queryInput} ${artistHint}`
    : queryInput

  // 1. Genius search (metadata)
  let meta = null
  try {
    meta = await searchGenius(query)
  } catch { /* Genius down / no token, skip */ }

  // Kalau Genius gak return hasil, pakai query langsung
  const title  = meta?.title  || queryInput
  const artist = meta?.artist || artistHint || queryInput

  // 2. Fetch lirik via provider chain
  const { lyrics, source, warning, fromCache } = await fetchLyricsWithFallback(artist, title)

  return {
    title,
    artist,
    thumbnail:  meta?.thumbnail || null,
    geniusUrl:  meta?.url || null,
    lyrics,
    source,
    warning,
    fromCache:  fromCache || false,
  }
}

module.exports = { getLyrics }