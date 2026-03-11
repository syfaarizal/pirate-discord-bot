const CHANNEL_IDS = process.env.CHANNEL_IDS
  ? process.env.CHANNEL_IDS.split(",").map(id => id.trim()).filter(Boolean)
  : []

const guildChannelMap = new Map()

async function buildGuildChannelMap(client) {
  guildChannelMap.clear()
  for (const id of CHANNEL_IDS) {
    try {
      const channel = await client.channels.fetch(id)
      if (!channel || !channel.guildId) continue
      const gid = channel.guildId
      if (!guildChannelMap.has(gid)) guildChannelMap.set(gid, [])
      guildChannelMap.get(gid).push(id)
    } catch {
      console.warn(`⚠️ Gagal fetch channel saat build map: ${id}`)
    }
  }
  console.log(`🗺️  Guild-channel map built: ${guildChannelMap.size} guild(s)`)
  for (const [gid, cids] of guildChannelMap) {
    console.log(`   Guild ${gid} → ${cids.length} channel(s)`)
  }
}

async function broadcast(client, message) {
  for (const id of CHANNEL_IDS) {
    try {
      const channel = await client.channels.fetch(id)
      if (!channel) continue
      await channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })
    } catch (err) {
      console.error(`⚠️ Gagal broadcast ke channel ${id}:`, err.message)
    }
  }
}

async function broadcastToGuild(client, guildId, message) {
  const channelIds = guildChannelMap.get(guildId)
  if (!channelIds || channelIds.length === 0) {
    // Guild belum ada di map (mungkin baru gabung), fallback ke semua channel di guild itu
    try {
      const guild = await client.guilds.fetch(guildId)
      if (!guild) return
    } catch {
      return
    }
    return
  }

  for (const id of channelIds) {
    try {
      const channel = await client.channels.fetch(id)
      if (!channel) continue
      await channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })
    } catch (err) {
      console.error(`⚠️ Gagal broadcast ke guild ${guildId} channel ${id}:`, err.message)
    }
  }
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

module.exports = { broadcast, broadcastToGuild, buildGuildChannelMap, randomPick, CHANNEL_IDS, guildChannelMap }