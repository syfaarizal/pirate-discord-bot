require("dotenv").config()

const { REST, Routes } = require("discord.js")
const { joinData, leaveData } = require("./commands/slash/join")

const commands = [
  require("./commands/slash/help").data.toJSON(),
  require("./commands/slash/ping").data.toJSON(),
  require("./commands/slash/about").data.toJSON(),
  require("./commands/slash/forget").data.toJSON(),
  require("./commands/slash/reminder").data.toJSON(),
  require("./commands/slash/askAi").data.toJSON(),
  joinData.toJSON(),
  leaveData.toJSON(),
]

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

async function deploy() {
  try {
    console.log(`\n🚀 Deploying ${commands.length} slash command(s)...`)
    commands.forEach(c => console.log(`   /${c.name}`))
    console.log("")

    const hasGuildId = Boolean(process.env.GUILD_ID)
    const route = hasGuildId
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID)

    await rest.put(route, { body: commands })
    console.log(
      hasGuildId
        ? `✅ Deployed to guild ${process.env.GUILD_ID} (biasanya langsung muncul)`
        : "✅ Deployed global (aktif ~1 jam)"
    )
  } catch (err) {
    console.error("❌ Deploy gagal:", err)
  }
}

deploy()