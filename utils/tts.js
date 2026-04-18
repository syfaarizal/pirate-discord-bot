const { execFile } = require("child_process")
const path         = require("path")
const os           = require("os")
const fs           = require("fs")

// Hardcode full path supaya PM2 gak kehilangan PATH
const ESPEAK  = "/usr/bin/espeak-ng"
const FFMPEG  = "/usr/bin/ffmpeg"

function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const base    = path.join(os.tmpdir(), `kichi_tts_${Date.now()}`)
    const wavPath = `${base}.wav`
    const mp3Path = `${base}.mp3`

    // Step 1: espeak-ng → WAV
    execFile(ESPEAK, ["-v", "id", "-s", "145", "-p", "55", "-a", "180", text, "-w", wavPath], (err) => {
      if (err) return reject(new Error(`espeak-ng error: ${err.message}`))

      // Step 2: WAV → MP3
      execFile(FFMPEG, ["-i", wavPath, "-acodec", "libmp3lame", "-q:a", "4", mp3Path, "-y", "-loglevel", "quiet"], (err2) => {
        try { fs.unlinkSync(wavPath) } catch { /* skip */ }
        if (err2) return reject(new Error(`ffmpeg error: ${err2.message}`))
        resolve(mp3Path)
      })
    })
  })
}

function cleanupTempFile(filePath) {
  try { fs.unlinkSync(filePath) } catch { /* skip */ }
}

module.exports = { textToSpeech, cleanupTempFile }