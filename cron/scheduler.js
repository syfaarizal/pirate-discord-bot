const cron = require("node-cron")
const { broadcastToGuild, guildChannelMap, randomPick } = require("../utils/broadcast")
const { getAllConfigs } = require("../utils/reminderConfig")

const timezone = "Asia/Jakarta"

const MESSAGES = {
  sahur: [
    "Sahur time cuy! Jangan sampe kelewatan yh, ntar nyesel sendiri wkwk 🍚",
    "Halo kaum sepertiga malam! Sahur dulu dong, masa mau puasa tapi perut kosong? No cap itu bahaya fr.",
    "OI SAHUR! Gua tau lu pada males bangun tapi ya tetep harus dong bestie 😭🍽️",
    "Sahur time~ kalian makan apa nih? Gua doain semoga bukan mi instan terus-terusan lol"
  ],
  subuh: [
    "Oke udah sahur kan? Sekarang terserah mau tidur lagi atau nggak, gua gak akan judge... tapi lu tau sendiri lah ya 😏",
    "Kaum yang balik tidur setelah subuh: understood the assignment. Kaum yang lanjut melek: respect, tapi kenapa? 💀",
    "Ngl tidur setelah subuh itu hits different. Tapi inget, jangan kesiangan juga ya bestie."
  ],
  pagi: [
    "Morning crue! Semangat puasanya yaww, hari ini harus slay! ☀️",
    "Selamat pagi~ reminder: lu udah puasa, jadi jangan kebuka-buka kulkas deh wkwk 🫡",
    "Good morning bestie! Semoga hari ini vibes-nya bagus dan puasanya lancar no drama ya 🙏",
    "Rise and shine! Atau rise doang dulu deh, shine nanti kalau udah kuat ☀️😭"
  ],
  siang: [
    "Siang-siang gini paling valid tuh tidur sebentar. Energy saving mode: on 💤",
    "Jam 12, perut laper, mata berat. Solusinya: tidur aja biar ga kerasa wkwk 😭",
    "Lowkey jam segini tuh ujian banget. Tapi kalian kuat dong, no cap! Tetep semangat 💪",
    "Siang hari hits different pas puasa. Sus banget sebenernya, tapi kalian pasti kuat lah 😤"
  ],
  ngabuburit: [
    "Cie udah masuk zona ngabuburit! Bentar lagi buka, kalian survive hari ini, slay! 🌅",
    "Waktu ngabuburit cuy~ mending ngapain nih? Scroll tiktok? Tidur? Masak? Pilihan kalian valid semua fr.",
    "Sore-sore gini vibes-nya beda banget ya. Bentar lagi buka, tahan dikit lagi bestie! 🙏",
    "Ngabuburit check! Lu pada udah tau mau buka sama apa belum? Jangan dadakan nanti galau milih 😭"
  ],
  buka: [
    "BUKA PUASAAA CUY! KALIAN UDAH SURVIVE HARI INI, FR FR SLAY BANGET! 🎉🍴",
    "WIHH BUKAA! Selamat berbuka crue, kalian tuh kuat banget no cap. Menu hari ini apa nih? 🍽️",
    "YEAYY SAATNYA MAKAN! Tapi inget, jangan kalap dulu, pelan-pelan aja biar perut gak kaget 😭🙏",
    "BUKA PUASA TIME! Understood the assignment seharian, sekarang waktunya reward diri sendiri! 🌙✨"
  ],
  malam: [
    "Malam crue~ pada ngapain nih? Kalau mau ngobrol, gua ada kok 😌",
    "Malem-malem gini vibes-nya santai ya. Gimana puasanya hari ini? Lancar? 🌙",
    "Malam! Semoga hari ini puasanya full dan gak ada drama. Kalau ada drama, cerita dong 👀",
    "Evening check~ abis buka pada ngapain aja? Gua lowkey penasaran wkwk 🌙"
  ],
  tidur: [
    "Bestie udah jam segini, TIDUR. Besok sahur lagi, jangan bandel 😭🛌",
    "Hoamm~ gua ngantuk, kalian harusnya juga ngantuk. Yuk tidur, jangan yapping mulu wkwk 💤",
    "Oke crue, ini reminder buat tidur. Gua serius. Kalian butuh istirahat fr fr. Gnight! 🌙",
    "TIDUR CUY! Besok masih ada hari, sekarang istirahat dulu. No debate, understood the assignment ya! 🛌"
  ]
}

function registerCronJobs(client) {
  console.log("\n📅 Registering per-minute scheduler (per-guild)...")

  cron.schedule("* * * * *", async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    const hour = now.getHours()
    const minute = now.getMinutes()

    const registeredGuildIds = [...guildChannelMap.keys()]
    if (registeredGuildIds.length === 0) return

    const allConfigs = getAllConfigs()

    for (const guildId of registeredGuildIds) {
      const guildConfig = allConfigs[guildId] || null

      for (const [key, messages] of Object.entries(MESSAGES)) {
        const { DEFAULTS } = require("../utils/reminderConfig")
        const reminder = guildConfig?.[key]
          ? { ...DEFAULTS[key], ...guildConfig[key] }
          : DEFAULTS[key]

        if (!reminder.enabled) continue
        if (reminder.hour !== hour || reminder.minute !== minute) continue

        // Match! Kirim ke guild ini
        await broadcastToGuild(client, guildId, randomPick(messages))
        console.log(`📣 [Cron] ${reminder.label} → guild ${guildId} @ ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`)
      }
    }
  }, { timezone })

  console.log("✅ Per-minute scheduler aktif!\n")
}

function rescheduleAll() {
  console.log("ℹ️  rescheduleAll() dipanggil — config akan dibaca otomatis di tick berikutnya.")
}

module.exports = { registerCronJobs, rescheduleAll }