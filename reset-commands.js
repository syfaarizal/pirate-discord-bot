require("dotenv").config()

const { REST, Routes } = require("discord.js")

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

async function reset() {
  const guildId  = process.env.GUILD_ID
  const clientId = process.env.CLIENT_ID

  if (!guildId) {
    console.error("❌ GUILD_ID gak ada di .env — script ini khusus guild mode.")
    process.exit(1)
  }

  try {
    console.log("🗑️  Wiping semua guild commands...")
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }  // array kosong = hapus semua
    )
    console.log("✅ Semua command lama udah dihapus dari Discord.")
    console.log("👉 Sekarang jalanin: node deploy-commands.js")
  } catch (err) {
    console.error("❌ Gagal reset commands:", err)
  }
}

reset()