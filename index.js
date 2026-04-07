require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const { onReady }           = require("./events/ready")
const { onInteractionCreate } = require("./events/interactionCreate")
const { onMessageCreate }   = require("./events/messageCreate")

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
    GatewayIntentBits.MessageContent, 
  ],
})

client.once("clientReady",      () => onReady(client))
client.on("interactionCreate",  (i) => onInteractionCreate(i))
client.on("messageCreate",      (m) => onMessageCreate(m))

process.on("unhandledRejection", err => console.error("⚠️ Unhandled Rejection:", err))
process.on("uncaughtException",  err => console.error("💥 Uncaught Exception:",  err))

client.login(process.env.TOKEN)