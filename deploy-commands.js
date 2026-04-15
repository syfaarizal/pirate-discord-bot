require("dotenv").config()

const { REST, Routes } = require("discord.js")
const { slashCommands } = require("./commands/slash/registry")

const commands = Array.from(
  new Map(slashCommands.map(cmd => [cmd.name, cmd.data.toJSON()])).values()
)

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
      // Prevent duplicate command rows in a guild (global + guild overlap).
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
      console.log("🧹 Global commands dibersihin dulu biar gak dobel di server.")

      for (const guildId of guildIds) {
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
          { body: commands }
        )
        console.log(`✅ Deployed to guild ${guildId} (biasanya langsung muncul)`)
      }
    } else {
      console.log("ℹ️ Deploy mode: global command only.")
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