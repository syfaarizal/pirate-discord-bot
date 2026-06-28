require("dotenv").config()

const { Client, GatewayIntentBits, REST, Routes } = require("discord.js")

const token = process.env.TOKEN
const clientId = process.env.CLIENT_ID

if (!token || !clientId) {
  console.error("❌ TOKEN atau CLIENT_ID tidak ditemukan di .env")
  process.exit(1)
}

const rest = new REST({ version: "10" }).setToken(token)

async function reset() {
  try {
    console.log("🗑️  Memulai pembersihan semua command (Global & Guild)...")

    // 1. Hapus Global Commands
    await rest.put(Routes.applicationCommands(clientId), { body: [] })
    console.log("✅ Global commands berhasil dihapus.")

    // 2. Hapus Guild Commands dari GUILD_ID / GUILD_IDS di .env jika ada
    const guildIds = (process.env.GUILD_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean)
    if (process.env.GUILD_ID?.trim()) guildIds.push(process.env.GUILD_ID.trim())

    for (const gId of new Set(guildIds)) {
      try {
        await rest.put(Routes.applicationGuildCommands(clientId, gId), { body: [] })
        console.log(`✅ Guild commands di guild ${gId} berhasil dihapus.`)
      } catch (e) {
        console.error(`⚠️ Gagal hapus guild commands di ${gId}:`, e.message)
      }
    }

    // 3. Connect ke client untuk membersihkan guild commands di semua server bot
    const client = new Client({ intents: [GatewayIntentBits.Guilds] })
    client.once("clientReady", async () => {
      console.log(`🤖 Login sebagai ${client.user.tag} untuk mengecek & membersihkan server...`)
      for (const [gId, guild] of client.guilds.cache) {
        try {
          await rest.put(Routes.applicationGuildCommands(clientId, gId), { body: [] })
          console.log(`🧹 Guild commands di "${guild.name}" (${gId}) dibersihkan.`)
        } catch (e) {
          console.error(`⚠️ Gagal membersihkan guild commands di ${guild.name}:`, e.message)
        }
      }
      console.log("\n✨ Selesai! Semua command (global & guild) telah dibersihkan.")
      console.log("👉 Jalankan 'node deploy-commands.js' untuk deploy ulang secara bersih.\n")
      client.destroy()
      process.exit(0)
    })

    client.login(token)
  } catch (err) {
    console.error("❌ Gagal reset:", err)
    process.exit(1)
  }
}

reset()