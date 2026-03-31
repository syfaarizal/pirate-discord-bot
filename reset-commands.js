require("dotenv").config()

const { REST, Routes } = require("discord.js")

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

async function reset() {
  const clientId = process.env.CLIENT_ID

  if (!clientId) {
    console.error("❌ CLIENT_ID gak ada di .env")
    process.exit(1)
  }

  try {
    console.log("🗑️  Wiping semua global commands...")
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] }
    )
    console.log("✅ Semua command lama udah dihapus.")
    console.log("👉 Sekarang jalanin: node deploy-commands.js")
  } catch (err) {
    console.error("❌ Gagal reset:", err)
  }
}

reset()