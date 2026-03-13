const { SlashCommandBuilder } = require("discord.js")

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Cek apakah bot masih hidup dan latensinya")

async function execute(interaction) {
  const sent = await interaction.reply({ content: "🏓 Ngitung dulu...", fetchReply: true })

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp
  const ws        = Math.round(interaction.client.ws.ping)

  const rtEmoji = roundtrip < 200 ? "🟢" : roundtrip < 500 ? "🟡" : "🔴"
  const wsEmoji = ws        < 100 ? "🟢" : ws        < 300 ? "🟡" : "🔴"

  const embed = {
    color: 0x5865f2,
    title: "🏓 Pong!",
    fields: [
      { name: `${rtEmoji} Roundtrip`, value: `\`${roundtrip}ms\``, inline: true },
      { name: `${wsEmoji} WebSocket`, value: `\`${ws}ms\``,        inline: true },
    ],
    footer: {
      text: roundtrip < 200 ? "Kenceng! Gua masih seger nih."
          : roundtrip < 500 ? "Lumayan, gak lemot-lemot amat."
          :                   "Aduh, gua rada lemot nih. Maap ya."
    },
    timestamp: new Date().toISOString()
  }

  return interaction.editReply({ content: null, embeds: [embed] })
}

module.exports = { data, execute }