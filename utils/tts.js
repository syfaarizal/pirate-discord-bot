const { execFile } = require("child_process")
const path         = require("path")
const os           = require("os")
const fs           = require("fs")

const ESPEAK = "/usr/bin/espeak-ng"

/**
 * TTS via espeak-ng, output WAV langsung.
 * @discordjs/voice bisa baca WAV tanpa perlu ffmpeg.
 *
 * @param {string} text
 * @returns {Promise<string>} path ke temp .wav file
 */
function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const wavPath = path.join(os.tmpdir(), `kichi_tts_${Date.now()}.wav`)

    execFile(
      ESPEAK,
      ["-v", "id", "-s", "145", "-p", "55", "-a", "180", text, "-w", wavPath],
      (err) => {
        if (err) return reject(new Error(`espeak-ng error: ${err.message}`))
        if (!fs.existsSync(wavPath)) return reject(new Error("espeak-ng gagal buat file WAV"))
        resolve(wavPath)
      }
    )
  })
}

function cleanupTempFile(filePath) {
  try { fs.unlinkSync(filePath) } catch { /* skip */ }
}

module.exports = { textToSpeech, cleanupTempFile }