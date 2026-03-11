const { clearHistory } = require("../utils/memory")

async function forgetCommand(message) {
  const username = message.author.globalName || message.author.username
  clearHistory(message.author.id)

  const responses = [
    `Oke ${username}, gua udah lupa semua yang kita obrolin. Fresh start! Kayak move on, tapi lebih cepet 💀`,
    `Done! Memory gua soal lu udah dihapus, ${username}. Kita mulai lagi dari nol ya. Gak ada drama.`,
    `Siap ${username}, gua udah amnesia soal lu. Kita kenalan lagi? Atau langsung ngobrol aja? 😂`
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return message.reply(randomResponse)
}

module.exports = { forgetCommand }