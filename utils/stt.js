const fs      = require("fs")
const path    = require("path")
const os      = require("os")
const OpenAI  = require("openai")

const ai = new OpenAI({
  apiKey:  process.env.AI_KEY,
  baseURL: "https://openrouter.ai/api/v1",
})

/**
 *
 * @param {Buffer} pcmBuffer  — raw PCM data
 * @returns {Promise<string>} — transcribed text, lowercase
 */
async function transcribe(pcmBuffer) {
  if (!pcmBuffer || pcmBuffer.length < 1000) return ""  // terlalu pendek / noise

  // Wrap PCM ke WAV header supaya Whisper bisa baca
  const wavBuffer = pcmToWav(pcmBuffer, 48000, 2, 16)

  const tmpPath = path.join(os.tmpdir(), `kichi_stt_${Date.now()}.wav`)
  fs.writeFileSync(tmpPath, wavBuffer)

  try {
    // Whisper via OpenRouter
    const form = new (require("form-data"))()
    form.append("file", fs.createReadStream(tmpPath), { filename: "audio.wav", contentType: "audio/wav" })
    form.append("model", "openai/whisper-1")
    form.append("language", "id")  // hint Bahasa Indonesia, bisa deteksi sendiri kalau gak diisi

    // OpenRouter belum support audio endpoint, pakai OpenAI langsung
    const openaiDirect = new OpenAI({ apiKey: process.env.OPENAI_KEY || process.env.AI_KEY })
    const result = await openaiDirect.audio.transcriptions.create({
      file:     fs.createReadStream(tmpPath),
      model:    "whisper-1",
      language: "id",
    })

    return (result.text || "").trim().toLowerCase()
  } finally {
    try { fs.unlinkSync(tmpPath) } catch { /* skip */ }
  }
}

/**
 * Convert raw PCM buffer ke WAV dengan header yang bener
 */
function pcmToWav(pcmBuffer, sampleRate, channels, bitDepth) {
  const byteRate    = sampleRate * channels * (bitDepth / 8)
  const blockAlign  = channels * (bitDepth / 8)
  const dataSize    = pcmBuffer.length
  const headerSize  = 44
  const buffer      = Buffer.alloc(headerSize + dataSize)

  buffer.write("RIFF",       0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write("WAVE",       8)
  buffer.write("fmt ",       12)
  buffer.writeUInt32LE(16,   16)  // PCM chunk size
  buffer.writeUInt16LE(1,    20)  // PCM format
  buffer.writeUInt16LE(channels,  22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate,  28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitDepth,  34)
  buffer.write("data",       36)
  buffer.writeUInt32LE(dataSize,  40)
  pcmBuffer.copy(buffer, 44)

  return buffer
}

module.exports = { transcribe }