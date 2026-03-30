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
        value: "`/reminder list` — Lihat semua jadwal + status + channel terdaftar.",
      },
      {
        name: "⏰ Reminder (Admin/Mod Only) 🔒",
        value: [
          "`/reminder create` — Buat custom reminder baru.",
          "`/reminder edit` — Edit reminder: toggle, ubah jam, kelola teks pesan.",
          "`/reminder delete <key>` — Hapus custom reminder.",
          "`/reminder channel add/remove/list` — Manage channel penerima reminder.",
        ].join("\n"),
      },
      {
        name: "💡 Pro Tip",
        value: "Tinggal bilang ke gua:\n`kichi bikinin reminder tiap jam 9 malam` — gua langsung buatin, no command needed.",
      },
    ],
    footer: { text: "Pirate Helper • Sarkastik tapi care ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

module.exports = { data, execute }