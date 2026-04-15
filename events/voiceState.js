const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice")

async function onVoiceStateUpdate(oldState, newState) {
  const guild     = newState.guild ?? oldState.guild
  const guildId   = guild.id
  const client    = newState.client ?? oldState.client
  const botId     = client.user.id
  const connection = getVoiceConnection(guildId)

  // Bot gak di VC → gak perlu ngapa-ngapain
  if (!connection) return

  const botChannelId = connection.joinConfig?.channelId

  // ── Auto-follow: user yang udah ada di VC bot pindah channel ──
  // Syarat: bukan bot itu sendiri yang gerak, dan dia sebelumnya di VC bot
  const isBot         = newState.member?.id === botId || oldState.member?.id === botId
  const wasInBotVC    = oldState.channelId === botChannelId
  const movedElsewhere = newState.channelId && newState.channelId !== botChannelId

  if (!isBot && wasInBotVC && movedElsewhere) {
    // User yang tadi di VC bot pindah — cek dulu apakah VC bot sekarang jadi kosong
    const botChannel = guild.channels.cache.get(botChannelId)
    const humanCount = botChannel?.members?.filter(m => !m.user.bot).size ?? 0

    if (humanCount === 0) {
      // VC bot kosong → ikut si user yang pindah
      const targetChannel = newState.channel
      if (!targetChannel) return

      try {
        joinVoiceChannel({
          channelId:      targetChannel.id,
          guildId:        guildId,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf:       true,
          selfMute:       false,
        })
        console.log(`🔀 [VC] Follow user ke ${targetChannel.name} (${guildId})`)
      } catch (err) {
        console.error("[VC Follow Error]", err)
      }
    }
    return
  }

  // ── Auto-leave: cek kalau VC bot jadi kosong ──
  // (user leave atau kick, bukan pindah)
  if (!isBot && oldState.channelId === botChannelId && !newState.channelId) {
    const botChannel = guild.channels.cache.get(botChannelId)
    const humanCount = botChannel?.members?.filter(m => !m.user.bot).size ?? 0

    if (humanCount === 0) {
      connection.destroy()
      console.log(`👋 [VC] Auto-leave — channel kosong (${guildId})`)
    }
  }
}

module.exports = { onVoiceStateUpdate }