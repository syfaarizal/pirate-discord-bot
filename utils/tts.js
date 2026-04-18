const { execFile } = require("child_process")
const path         = require("path")
const os           = require("os")
const fs           = require("fs")

/**
 * TTS via espeak-ng (offline, no API key, no billing)
 * Output: .mp3 via ffmpeg convert, langsung bisa dimainkan @discordjs/voice
 *
 * Requirements (sudah ada di VPS):
 *   apt install espeak-ng   ← text-to-speech engine
 *   ffmpeg                  ← convert WAV → MP3
 *
 * @param {string} text
 * @returns {Promise<string>} path ke temp file .mp3
 */
function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const base   = path.join(os.tmpdir(), `kichi_tts_${Date.now()}`)
    const wavPath = `${base}.wav`
    const mp3Path = `${base}.mp3`

    // Step 1: espeak-ng → WAV
    // -v id    : bahasa Indonesia
    // -s 145   : speed (words/min), default 175 — sedikit lebih lambat biar jelas
    // -p 55    : pitch (0-99), default 50
    // -a 180   : amplitude (volume), default 100
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