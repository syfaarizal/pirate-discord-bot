require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const { onReady } = require("./events/ready")
const { onMessageCreate } = require("./events/messageCreate")

// ─────────────────────────────────────
// Validasi env
// ─────────────────────────────────────
const requiredEnvs = ["TOKEN", "AI_KEY", "CHANNEL_IDS"]
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`)
    process.exit(1)
  }
}

// ─────────────────────────────────────
// Init Discord Client
// ─────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// ─────────────────────────────────────
// Register Events
// ─────────────────────────────────────
client.once("ready", () => onReady(client))

client.on("messageCreate", (message) => onMessageCreate(message, client))

// ─────────────────────────────────────
// Global Error Handler (biar bot gak mati kena uncaught error)
// ─────────────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Promise Rejection:", err)
})

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err)
})

// ─────────────────────────────────────
// Login
// ─────────────────────────────────────
client.login(process.env.TOKEN)