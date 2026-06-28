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
      // Mode testing: deploy ke guild spesifik (langsung aktif, tanpa delay 1 jam)
      // Global commands dikosongkan dulu supaya gak dobel di server testing kamu.
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
      console.log("🧹 Global commands dibersihkan supaya tidak dobel di server testing.")

      for (const guildId of guildIds) {
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
          { body: commands }
        )
        console.log(`✅ Deployed ke guild ${guildId} (langsung aktif)`)
      }

      console.log("\n⚠️  Mode testing aktif (GUILD_ID/GUILD_IDS terdeteksi).")
      console.log("   Global commands dikosongkan — user lain TIDAK bisa pakai bot.")
      console.log("   Hapus GUILD_ID & GUILD_IDS dari .env untuk deploy production.\n")
    } else {
      // Mode production: deploy global — aktif di semua server yang sudah/akan add bot
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
      console.log("✅ Global commands deployed (berlaku untuk semua server)")
      console.log("ℹ️  Server yang baru add bot akan otomatis mendapatkan global commands ini.\n")
    }
  } catch (err) {
    console.error("❌ Deploy gagal:", err)
  }
}

deploy()