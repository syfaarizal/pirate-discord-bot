require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const { onReady }             = require("./events/ready")
const { onInteractionCreate } = require("./events/interactionCreate")

const requiredEnvs = ["TOKEN", "AI_KEY", "CLIENT_ID"]
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`❌ Missing env: ${key}`)
    process.exit(1)
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
})

client.once("ready", () => ready(client))
client.on("interactionCreate", (i) => onInteractionCreate(i))

process.on("unhandledRejection", err => console.error("⚠️ Unhandled Rejection:", err))
process.on("uncaughtException",  err => console.error("💥 Uncaught Exception:",  err))

client.login(process.env.TOKEN)