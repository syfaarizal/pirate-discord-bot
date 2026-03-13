const { SlashCommandBuilder } = require("discord.js")
const { clearHistory } = require("../../utils/memory")

const data = new SlashCommandBuilder()
  .setName("forget")
  .setDescription("Hapus memory percakapan kita. Fresh start!")

async function execute(interaction) {
  const username = interaction.user.globalName || interaction.user.username
  clearHistory(interaction.user.id)

  const responses = [
    `Oke ${username}, gua udah lupa semua yang kita obrolin. Kayak move on, tapi lebih cepet 💀`,
    `Done! Memory gua soal lu udah dihapus, ${username}. Kita mulai lagi dari nol, gak ada drama.`,
    `Siap ${username}, gua udah amnesia soal lu. Kenalan lagi? Atau langsung ngobrol aja? 😂`,
  ]

  return interaction.reply({
    content: responses[Math.floor(Math.random() * responses.length)],
    ephemeral: true   // biar gak spam channel
  })
}

module.exports = { data, execute }