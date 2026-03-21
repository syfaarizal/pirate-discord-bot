const { SlashCommandBuilder } = require("discord.js")

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Lihat semua command yang bisa dipake di bot ini")

async function execute(interaction) {
  const embed = {
    color: 0x5865f2,
    title: "⚓ Pirate Helper — Command List",
    description: "Ini semua yang bisa gua lakuin. Lumayan lah, gak cuma diem doang.",
    fields: [
      {
        name: "🤖 AI & General",
        value: [
          "`/ask-ai` — Ngobrol sama gua. Tanya apapun, gua jawab (kalau tau).",
          "`/forget` — Reset memory percakapan kita. Fresh start!",
          "`/ping` — Cek latency bot.",
          "`/about` — Info tentang gua.",
          "`/help` — Nampilin pesan ini.",
        ].join("\n")
      },
      {
        name: "⏰ Reminder (Semua User)",
        value: [
          "`/reminder list` — Lihat semua jadwal + statusnya.",
          "`/reminder list-text <nama>` — Lihat semua teks pesan sebuah reminder.",
        ].join("\n")
      },
      {
        name: "⏰ Reminder — Jadwal (Admin/Mod Only) 🔒",
        value: [
          "`/reminder on/off <nama>` — Toggle reminder (pakai `all` untuk semua).",
          "`/reminder set-time <nama> <HH:MM>` — Ubah jam reminder.",
          "`/reminder add <key> <label> <jam>` — Buat custom reminder baru.",
          "`/reminder delete <key>` — Hapus custom reminder.",
          "`/reminder reset` — Reset jadwal built-in ke default.",
        ].join("\n")
      },
      {
        name: "⏰ Reminder — Teks Pesan (Admin/Mod Only) 🔒",
        value: [
          "`/reminder add-text <nama> <teks>` — Tambah teks pesan ke reminder.",
          "`/reminder remove-text <nama> <nomor>` — Hapus salah satu teks.",
        ].join("\n")
      },
      {
        name: "📢 Channel Reminder (Admin/Mod Only) 🔒",
        value: [
          "`/set-reminder-channel add <#channel>` — Tambah channel penerima reminder.",
          "`/set-reminder-channel remove <#channel>` — Lepas channel dari daftar.",
          "`/set-reminder-channel list` — Lihat semua channel terdaftar.",
        ].join("\n")
      },
    ],
    footer: { text: "Pirate Helper • Sarkastik tapi care ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

module.exports = { data, execute }