const BASE_DELAY_MS = 800
const PER_CHAR_MS = 18
const MAX_DELAY_MS = 4500

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Simulate natural typing indicator + delay
 * @param {import('discord.js').TextChannel} channel
 * @param {string} responseText - text yang mau dikirim (buat hitung durasi)
 */
async function simulateTyping(channel, responseText = "") {
  const charCount = responseText.length || 100
  const delay = Math.min(BASE_DELAY_MS + charCount * PER_CHAR_MS, MAX_DELAY_MS)

  await channel.sendTyping()

  // Kalau delay panjang, kirim sendTyping lagi tiap ~8 detik (biar gak ilang)
  if (delay > 8000) {
    await sleep(8000)
    await channel.sendTyping()
    await sleep(delay - 8000)
  } else {
    await sleep(delay)
  }
}

module.exports = { simulateTyping, sleep }