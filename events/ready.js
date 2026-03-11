const { ActivityType } = require("discord.js")
const { broadcast, CHANNEL_IDS } = require("../utils/broadcast")
const { registerCronJobs } = require("../cron/scheduler")

async function onReady(client) {

  console.log(`\n⚓ ════════════════════════════════════`)
  console.log(`   ✅ Bot online sebagai : ${client.user.tag}`)
  console.log(`   🌍 Timezone           : Asia/Jakarta (WIB)`)
  console.log(`   🖥️  System timezone    : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  console.log(`   🏠 Guilds terdaftar   : ${client.guilds.cache.size}`)
  console.log(`⚓ ════════════════════════════════════\n`)

  client.user.setPresence({
    activities: [{
      name: "mention gua buat ngobrol ⚓",
      type: ActivityType.Watching
    }],
    status: "online"
  })
  console.log("🎮 Bot presence/status berhasil di-set.")

  console.log(`\n📡 Validasi ${CHANNEL_IDS.length} channel(s)...`)

  if (CHANNEL_IDS.length === 0) {
    console.warn("⚠️  CHANNEL_IDS kosong! Bot gak bisa broadcast. Cek .env kamu.")
  } else {
    for (const id of CHANNEL_IDS) {
      try {
        const channel = await client.channels.fetch(id)
        if (channel) {
          console.log(`   ✅ Channel OK : #${channel.name} (${id})`)
        } else {
          console.warn(`   ❌ Channel NOT FOUND : ${id}`)
        }
      } catch {
        console.warn(`   ❌ Gagal fetch channel : ${id} (mungkin salah ID atau bot gak punya akses)`)
      }
    }
  }

  console.log("\n📣 Kirim pesan online ke semua channel...")
  await broadcast(client, "Aye aye crue! ⚓ Gua udah online nih, siap nemenin kalian.")
  console.log("✅ Pesan online terkirim.\n")

  registerCronJobs(client)
}

module.exports = { onReady }