const { REST, Routes } = require("discord.js")
const { slashCommands } = require("../commands/slash/registry")

const commands = Array.from(
  new Map(slashCommands.map(cmd => [cmd.name, cmd.data.toJSON()])).values()
)

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

async function onGuildCreate(guild) {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
      { body: commands }
    )
    console.log(`✅ [guildCreate] Commands deployed ke guild baru: ${guild.name} (${guild.id})`)
  } catch (err) {
    console.error(`❌ [guildCreate] Gagal deploy commands ke ${guild.name} (${guild.id}):`, err)
  }
}

module.exports = { onGuildCreate }