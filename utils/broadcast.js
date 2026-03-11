const CHANNEL_IDS = process.env.CHANNEL_IDS
  ? process.env.CHANNEL_IDS.split(",").map(id => id.trim()).filter(Boolean)
  : []

async function broadcast(client, message) {
  for (const id of CHANNEL_IDS) {
    try {
      const channel = await client.channels.fetch(id)

      if (!channel) {
        console.warn(`⚠️ Channel tidak ditemukan: ${id}`)
        continue
      }

      await channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })

    } catch (err) {
      console.error(`⚠️ Gagal kirim ke channel ${id}:`, err.message)
    }
  }
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

module.exports = { broadcast, randomPick, CHANNEL_IDS }