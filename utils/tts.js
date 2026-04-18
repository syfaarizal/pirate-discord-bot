const { execFile } = require("child_process")
const path         = require("path")
const os           = require("os")
const fs           = require("fs")

/**
 *
 * @param {string} text
 * @returns {Promise<string>} path ke temp file .mp3
 */
function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const base   = path.join(os.tmpdir(), `kichi_tts_${Date.now()}`)
    const wavPath = `${base}.wav`
    const mp3Path = `${base}.mp3`

    execFile(
      "espeak-ng",
      ["-v", "id", "-s", "145", "-p", "55", "-a", "180", text, "-w", wavPath],
      (err) => {
        if (err) return reject(new Error(`espeak-ng error: ${err.message}`))

        // Step 2: ffmpeg WAV → MP3
        execFile(
          "ffmpeg",
          ["-i", wavPath, "-acodec", "libmp3lame", "-q:a", "4", mp3Path, "-y", "-loglevel", "quiet"],
          (err2) => {
            // Hapus WAV sementara
            try { fs.unlinkSync(wavPath) } catch { /* skip */ }

            if (err2) return reject(new Error(`ffmpeg error: ${err2.message}`))
            resolve(mp3Path)
          }
        )
      }
    )
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