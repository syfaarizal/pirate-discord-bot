const { REST, Routes } = require("discord.js")

async function onGuildCreate(guild) {
  console.log(`🏰 [guildCreate] Bot telah ditambahkan ke server baru: ${guild.name} (${guild.id})`)
  // Global commands otomatis tersedia di server baru tanpa perlu register guild commands.
}

module.exports = { onGuildCreate }