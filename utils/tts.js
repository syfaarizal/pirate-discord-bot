const { execFile } = require("child_process")
const path         = require("path")
const os           = require("os")
const fs           = require("fs")

// Path dari .env — set setelah install-piper.sh selesai
const PIPER_BIN   = process.env.PIPER_BIN   || "/root/piper/piper"
const PIPER_MODEL = process.env.PIPER_MODEL || "/root/piper/models/id_ID-argana-medium.onnx"

/**
 * TTS via Piper — neural TTS, offline, output WAV
 * @param {string} text
 * @returns {Promise<string>} path ke temp .wav
 */
function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const wavPath = path.join(os.tmpdir(), `kichi_tts_${Date.now()}.wav`)

    // Piper baca teks dari stdin, output ke file
    const proc = execFile(
      PIPER_BIN,
      ["--model", PIPER_MODEL, "--output_file", wavPath, "--quiet"],
      (err) => {
        if (err) return reject(new Error(`piper error: ${err.message}`))
        if (!fs.existsSync(wavPath)) return reject(new Error("piper gagal buat WAV"))
        resolve(wavPath)
      }
    )

    // Tulis teks ke stdin Piper lalu tutup
    proc.stdin.write(text)
    proc.stdin.end()
  })
}

function cleanupTempFile(filePath) {
  try { fs.unlinkSync(filePath) } catch { /* skip */ }
}

module.exports = { textToSpeech, cleanupTempFile }