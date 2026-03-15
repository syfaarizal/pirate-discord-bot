const cron = require("node-cron")
const { randomPick } = require("../utils/broadcast")
const { getAllConfigs, REMINDER_DEFAULTS } = require("../utils/reminderConfig")

const timezone = "Asia/Jakarta"

const MESSAGES = {
  sahur:      ["Sahur time cuy! Jangan sampe kelewatan yh 🍚", "OI SAHUR! Gua tau males bangun tapi ya harus dong bestie 😭🍽️", "Sahur time~ kalian makan apa nih?", "Banguuun! Sahur dulu, jangan skip 🌙"],
  subuh:      ["Udah sahur? Mau tidur lagi silakan, gua gak judge 😏", "Kaum balik tidur setelah subuh: understood the assignment 💀", "Tidur setelah subuh hits different. Tapi jangan kesiangan ya bestie."],
  pagi:       ["Morning crue! Semangat puasanya, hari ini harus slay! ☀️", "Selamat pagi~ jangan kebuka-buka kulkas wkwk 🫡", "Good morning! Semoga vibes hari ini bagus dan puasanya lancar 🙏", "Rise and shine bestie! ☀️"],
  siang:      ["Siang-siang gini paling valid tidur sebentar. Energy saving mode on 💤", "Jam 12, perut laper, mata berat. Solusinya tidur aja wkwk 😭", "Lowkey jam segini ujian banget. Tapi kalian kuat, no cap! 💪"],
  ngabuburit: ["Udah masuk zona ngabuburit! Bentar lagi buka cuy 🌅", "Ngabuburit time~ mau ngapain nih? Semua pilihan valid fr.", "Sore-sore gini vibes-nya beda ya. Tahan dikit lagi bestie! 🙏"],
  buka:       ["BUKA PUASAAA CUY! KALIAN SURVIVE HARI INI, FR FR SLAY! 🎉🍴", "WIHH BUKAA! Selamat berbuka crue, kalian kuat banget 🍽️", "YEAYY SAATNYA MAKAN! Pelan-pelan dulu ya bestie 😭🙏", "BUKA PUASA! Udah understood the assignment seharian, reward yourself! 🌙✨"],
  malam:      ["Malam crue~ pada ngapain? Kalau mau ngobrol gua ada 😌", "Malem-malem vibes-nya santai ya. Gimana puasanya? 🌙", "Evening check~ abis buka pada ngapain aja? 👀"],
  tidur:      ["Bestie udah jam segini, TIDUR. Besok sahur lagi 😭🛌", "Hoamm~ yuk tidur, jangan yapping mulu wkwk 💤", "Ini reminder buat tidur. Gua serius. fr fr. Gnight! 🌙", "TIDUR CUY! No debate, understood the assignment ya! 🛌"],
}

async function sendToChannels(client, channels, message) {
  for (const channelId of channels) {
    try {
      const channel = await client.channels.fetch(channelId)
      if (!channel) continue
      await channel.send({
        content: `@everyone ${message}`,
        allowedMentions: { parse: ["everyone"] }
      })
    } catch (err) {
      console.error(`⚠️ Gagal kirim reminder ke channel ${channelId}:`, err.message)
    }
  }
}

function registerCronJobs(client) {
  console.log("\n📅 Registering per-minute cron scheduler...")

  cron.schedule("* * * * *", async () => {
    const now     = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    const hour    = now.getHours()
    const minute  = now.getMinutes()
    const configs = getAllConfigs()

    for (const [guildId, config] of Object.entries(configs)) {
      if (!config.channels?.length) continue

      for (const key of Object.keys(MESSAGES)) {
        const reminder = config[key] ?? REMINDER_DEFAULTS[key]
        if (!reminder.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        const message = randomPick(MESSAGES[key])
        await sendToChannels(client, config.channels, message)
        console.log(`📣 [Cron] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`)
      }
    }
  }, { timezone })

  console.log("✅ Cron registered!\n")
}

module.exports = { registerCronJobs }