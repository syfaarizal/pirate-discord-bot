const gTTS = require("node-gtts")
const path = require("path")
const os   = require("os")
const fs   = require("fs")

/**
 * Convert teks ke file audio .mp3 via Google Translate TTS (unofficial, free)
 * Langsung bisa dimainkan oleh @discordjs/voice via createAudioResource
 *
 * @param {string} text
 * @param {string} lang - language code (default: "id" untuk Bahasa Indonesia)
 * @returns {Promise<string>} path ke temp file .mp3
 */
function textToSpeech(text, lang = "id") {
  return new Promise((resolve, reject) => {
    const tmpPath = path.join(os.tmpdir(), `kichi_tts_${Date.now()}.mp3`)
    const tts     = gTTS(lang)

    tts.save(tmpPath, text, (err) => {
      if (err) return reject(err)
      resolve(tmpPath)
    })
  })
}

/**
 * Hapus temp file setelah selesai diputar
 * @param {string} filePath
 */
function cleanupTempFile(filePath) {
  try { fs.unlinkSync(filePath) } catch { /* skip */ }
}

module.exports = { textToSpeech, cleanupTempFile }