async function pingCommand(message, client) {
  const sent = await message.reply("🏓 Ngitung dulu...")

  const roundtrip = sent.createdTimestamp - message.createdTimestamp
  const wsLatency = Math.round(client.ws.ping)

  const latencyEmoji = roundtrip < 200 ? "🟢" : roundtrip < 500 ? "🟡" : "🔴"
  const wsEmoji = wsLatency < 100 ? "🟢" : wsLatency < 300 ? "🟡" : "🔴"

  const embed = {
    color: 0x5865f2,
    title: "🏓 Pong!",
    fields: [
      {
        name: `${latencyEmoji} Roundtrip Latency`,
        value: `\`${roundtrip}ms\``,
        inline: true
      },
      {
        name: `${wsEmoji} WebSocket Latency`,
        value: `\`${wsLatency}ms\``,
        inline: true
      }
    ],
    footer: {
      text: roundtrip < 200
        ? "Kenceng! Gua masih seger nih."
        : roundtrip < 500
        ? "Lumayan lah, gak lemot-lemot amat."
        : "Aduh, gua rada lemot nih. Maap ya."
    },
    timestamp: new Date().toISOString()
  }

  return sent.edit({ content: null, embeds: [embed] })
}

module.exports = { pingCommand }