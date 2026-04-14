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

    const guildIds = (process.env.GUILD_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean)

    const singleGuildId = process.env.GUILD_ID?.trim()
    if (singleGuildId && !guildIds.includes(singleGuildId)) {
      guildIds.push(singleGuildId)
    }

    if (guildIds.length > 0) {
      for (const guildId of guildIds) {
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
          { body: commands }
        )
        console.log(`✅ Deployed to guild ${guildId} (biasanya langsung muncul)`)
      }
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
      console.log("✅ Deployed global (aktif ~1 jam)")
    }

    if (!process.env.GUILD_ID && !process.env.GUILD_IDS && process.env.CHANNEL_IDS) {
      console.log("ℹ️  CHANNEL_IDS terdeteksi, tapi deploy slash command butuh GUILD_ID (ID server), bukan ID channel.")
    }
  } catch (err) {
    console.error("❌ Deploy gagal:", err)
  }
}

deploy()