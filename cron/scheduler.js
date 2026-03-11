/**
 * ⏰ Cron Scheduler
 * Semua jadwal pesan otomatis Ramadhan.
 * Timezone: Asia/Jakarta (WIB)
 */

const cron = require("node-cron")
const { broadcast, randomPick } = require("../utils/broadcast")

const timezone = "Asia/Jakarta"

function registerCronJobs(client) {
  console.log("📅 Mendaftarkan cron jobs...")

  // ─────────────────────────────────────
  // 🌙 SAHUR — 03:30
  // ─────────────────────────────────────
  cron.schedule("30 3 * * *", () => {
    broadcast(client, randomPick([
      "Sahur time cuy! Jangan sampe kelewatan yh, ntar nyesel sendiri wkwk 🍚",
      "Halo kaum sepertiga malam! Sahur dulu dong, masa mau puasa tapi perut kosong? No cap itu bahaya fr.",
      "OI SAHUR! Gua tau lu pada males bangun tapi ya tetep harus dong bestie 😭🍽️",
      "Sahur time~ kalian makan apa nih? Gua doain semoga bukan mi instan terus-terusan lol"
    ]))
    console.log("📣 [Cron] Sahur message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 😴 HABIS SUBUH — 04:45
  // ─────────────────────────────────────
  cron.schedule("45 4 * * *", () => {
    broadcast(client, randomPick([
      "Oke udah sahur kan? Sekarang terserah mau tidur lagi atau nggak, gua gak akan judge... tapi lu tau sendiri lah ya 😏",
      "Kaum yang balik tidur setelah subuh: understood the assignment. Kaum yang lanjut melek: respect, tapi kenapa? 💀",
      "Ngl tidur setelah subuh itu hits different. Tapi inget, jangan kesiangan juga ya bestie."
    ]))
    console.log("📣 [Cron] Habis subuh message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 🌞 PAGI — 07:00
  // ─────────────────────────────────────
  cron.schedule("0 7 * * *", () => {
    broadcast(client, randomPick([
      "Morning crue! Semangat puasanya yaww, hari ini harus slay! ☀️",
      "Selamat pagi~ reminder: lu udah puasa, jadi jangan kebuka-buka kulkas deh wkwk 🫡",
      "Good morning bestie! Semoga hari ini vibes-nya bagus dan puasanya lancar no drama ya 🙏",
      "Rise and shine! Atau rise doang dulu deh, shine nanti kalau udah kuat ☀️😭"
    ]))
    console.log("📣 [Cron] Pagi message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 😴 SIANG — 12:00
  // ─────────────────────────────────────
  cron.schedule("0 12 * * *", () => {
    broadcast(client, randomPick([
      "Siang-siang gini paling valid tuh tidur sebentar. Energy saving mode: on 💤",
      "Jam 12, perut laper, mata berat. Solusinya: tidur aja biar ga kerasa wkwk 😭",
      "Lowkey jam segini tuh ujian banget. Tapi kalian kuat dong, no cap! Tetep semangat 💪",
      "Siang hari hits different pas puasa. Sus banget sebenernya, tapi kalian pasti kuat lah 😤"
    ]))
    console.log("📣 [Cron] Siang message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 🌤 NGABUBURIT — 16:30
  // ─────────────────────────────────────
  cron.schedule("30 16 * * *", () => {
    broadcast(client, randomPick([
      "Cie udah masuk zona ngabuburit! Bentar lagi buka, kalian survive hari ini, slay! 🌅",
      "Waktu ngabuburit cuy~ mending ngapain nih? Scroll tiktok? Tidur? Masak? Pilihan kalian valid semua fr.",
      "Sore-sore gini vibes-nya beda banget ya. Bentar lagi buka, tahan dikit lagi bestie! 🙏",
      "Ngabuburit check! Lu pada udah tau mau buka sama apa belum? Jangan dadakan nanti galau milih 😭"
    ]))
    console.log("📣 [Cron] Ngabuburit message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 🌇 BUKA PUASA — 18:00
  // ─────────────────────────────────────
  cron.schedule("0 18 * * *", () => {
    broadcast(client, randomPick([
      "BUKA PUASAAA CUY! KALIAN UDAH SURVIVE HARI INI, FR FR SLAY BANGET! 🎉🍴",
      "WIHH BUKAA! Selamat berbuka crue, kalian tuh kuat banget no cap. Menu hari ini apa nih? 🍽️",
      "YEAYY SAATNYA MAKAN! Tapi inget, jangan kalap dulu, pelan-pelan aja biar perut gak kaget 😭🙏",
      "BUKA PUASA TIME! Understood the assignment seharian, sekarang waktunya reward diri sendiri! 🌙✨"
    ]))
    console.log("📣 [Cron] Buka puasa message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 🌙 MALAM — 21:00
  // ─────────────────────────────────────
  cron.schedule("0 21 * * *", () => {
    broadcast(client, randomPick([
      "Malam crue~ pada ngapain nih? Kalau mau ngobrol, gua ada kok 😌",
      "Malem-malem gini vibes-nya santai ya. Gimana puasanya hari ini? Lancar? 🌙",
      "Malam! Semoga hari ini puasanya full dan gak ada drama. Kalau ada drama, cerita dong 👀",
      "Evening check~ abis buka pada ngapain aja? Gua lowkey penasaran wkwk 🌙"
    ]))
    console.log("📣 [Cron] Malam message sent.")
  }, { timezone })

  // ─────────────────────────────────────
  // 😴 TIDUR — 23:30
  // ─────────────────────────────────────
  cron.schedule("30 23 * * *", () => {
    broadcast(client, randomPick([
      "Bestie udah jam segini, TIDUR. Besok sahur lagi, jangan bandel 😭🛌",
      "Hoamm~ gua ngantuk, kalian harusnya juga ngantuk. Yuk tidur, jangan yapping mulu wkwk 💤",
      "Oke crue, ini reminder buat tidur. Gua serius. Kalian butuh istirahat fr fr. Gnight! 🌙",
      "TIDUR CUY! Besok masih ada hari, sekarang istirahat dulu. No debate, understood the assignment ya! 🛌"
    ]))
    console.log("📣 [Cron] Tidur message sent.")
  }, { timezone })

  console.log("✅ Semua cron jobs terdaftar!\n")
}

module.exports = { registerCronJobs }