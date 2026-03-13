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
          "`/reminder list` — Lihat semua jadwal reminder + statusnya.",
        ].join("\n")
      },
      {
        name: "⏰ Reminder (Admin/Mod Only) 🔒",
        value: [
          "`/reminder on <nama>` — Aktifin reminder.",
          "`/reminder off <nama>` — Matiin reminder.",
          "`/reminder set-time <nama> <HH:MM>` — Ubah jam reminder.",
          "`/reminder reset` — Reset semua reminder ke default.",
          "`/set-reminder-channel` — Set channel tujuan broadcast reminder.",
        ].join("\n")
      },
    ],
    footer: { text: "Pirate Helper • Sarkastik tapi care ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

module.exports = { data, execute }