const { ActivityType } = require("discord.js")
const { registerCronJobs } = require("../cron/scheduler")

async function onReady(client) {
  console.log(`\n⚓ ════════════════════════════════════`)
  console.log(`   ✅ Bot online  : ${client.user.tag}`)
  console.log(`   🌍 Timezone   : Asia/Jakarta (WIB)`)
  console.log(`   🏠 Guilds     : ${client.guilds.cache.size}`)
  console.log(`⚓ ════════════════════════════════════\n`)

  client.user.setPresence({
    activities: [{ name: "/ask-ai buat ngobrol ⚓", type: ActivityType.Watching }],
    status: "online"
  })

  registerCronJobs(client)

  console.log("🤖 Bot siap!\n")
}

module.exports = { onReady }