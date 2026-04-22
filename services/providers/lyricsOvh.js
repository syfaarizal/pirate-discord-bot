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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("lyricsovh timeout")) })
  })
}

/**
 * Ambil lirik dari lyrics.ovh
 * @param {string} artist
 * @param {string} title
 * @returns {Promise<string | null>}
 */
async function getLyricsOvh(artist, title) {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    const { status, body } = await httpsGet(url)
    if (status !== 200) return null

    const data   = JSON.parse(body)
    const lyrics = data?.lyrics?.trim()
    return lyrics || null
  } catch {
    return null
  }
}

module.exports = { getLyricsOvh }