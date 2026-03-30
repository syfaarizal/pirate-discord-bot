require("dotenv").config()

const { REST, Routes } = require("discord.js")

const commands = [
  require("./commands/slash/help").data.toJSON(),
  require("./commands/slash/ping").data.toJSON(),
  require("./commands/slash/about").data.toJSON(),
  require("./commands/slash/forget").data.toJSON(),
  require("./commands/slash/reminder").data.toJSON(),
  require("./commands/slash/askAi").data.toJSON(),
]

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

async function deploy() {
  const guildId = process.env.GUILD_ID

  try {
    console.log(`\n🚀 Deploying ${commands.length} slash command(s)...`)
    commands.forEach(c => console.log(`   /${c.name}`))
    console.log("")

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands })
      console.log(`✅ Deployed ke guild ${guildId} (aktif instan)`)
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
      console.log("✅ Deployed global (aktif ~1 jam)")
    }
  } catch (err) {
    console.error("❌ Deploy gagal:", err)
  }
}

deploy()