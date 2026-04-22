const https = require("https")

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "PirateHelper/1.0" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location).then(resolve).catch(reject)
      }
      let data = ""
      res.on("data", c => (data += c))
      res.on("end", () => resolve({ status: res.statusCode, body: data }))
    })
    req.on("error", reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("lrclib timeout")) })
  })
}

/**
 * Ambil lirik dari LRCLIB (open source, no key needed)
 * @param {string} artist
 * @param {string} title
 * @returns {Promise<string | null>}
 */
async function getLyricsLrclib(artist, title) {
  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const { status, body } = await httpsGet(url)
    if (status !== 200) return null

    const results = JSON.parse(body)
    if (!Array.isArray(results) || results.length === 0) return null

    // Ambil yang ada plainLyrics
    const match = results.find(r => r.plainLyrics?.trim())
    return match?.plainLyrics?.trim() || null
  } catch {
    return null
  }
}

module.exports = { getLyricsLrclib }