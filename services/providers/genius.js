const https = require("https")

const GENIUS_TOKEN = process.env.GENIUS_TOKEN

// Keywords yang nandain hasil terjemahan, bukan lagu asli
const TRANSLATION_RX = /übersetzung|tradução|traduction|translation|перевод|traducción|tłumaczenie|翻訳|번역|terjemahan/i

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject)
      }
      let data = ""
      res.on("data", c => (data += c))
      res.on("end", () => resolve({ status: res.statusCode, body: data }))
    })
    req.on("error", reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("genius timeout")) })
  })
}

/**
 * Search lagu di Genius, return metadata (bukan lirik)
 * @param {string} query
 * @returns {Promise<{title, artist, album, thumbnail, url} | null>}
 */
async function searchGenius(query) {
  if (!GENIUS_TOKEN) return null

  const { body } = await httpsGet(
    `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
    { "Authorization": `Bearer ${GENIUS_TOKEN}`, "User-Agent": "PirateHelper/1.0" }
  )

  const hits = JSON.parse(body)?.response?.hits?.filter(h => h.type === "song") || []

  // Filter terjemahan, prioritas yang bukan
  const filtered = hits.filter(h => !TRANSLATION_RX.test(h.result.title))
  const song     = (filtered.length > 0 ? filtered : hits)[0]?.result

  if (!song) return null

  return {
    title:     song.title,
    artist:    song.primary_artist?.name || "",
    thumbnail: song.song_art_image_url || song.song_art_image_thumbnail_url || null,
    url:       song.url,
  }
}

module.exports = { searchGenius }