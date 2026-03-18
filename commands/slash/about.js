const { SlashCommandBuilder } = require("discord.js")

const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Info tentang Kichi")

async function execute(interaction) {
  const embed = {
    color: 0x5865f2,
    title: "⚓ Tentang Gua — Kichi",
    description: "Nama gua Kichi (a.k.a Pirate Helper). Dibuat sama mama gua, Kai Shi. Gua temen ngobrol Discord — sarkastik, receh, tapi care. No cap.",
    fields: [
      { name: "🤖 Powered by", value: "GPT-4o Mini via OpenRouter", inline: true },
      { name: "⚙️ Framework",  value: "Discord.js v14",            inline: true },
      { name: "🧠 Kemampuan", value: [
        "• Ngobrol santai & sarkastik pakai `/ask-ai`",
        "• Ingat percakapan per user (dalam satu sesi)",
        "• Ngirim reminder otomatis pagi & malam per server",
        "• Jadwal reminder bisa di-custom per server",
        "• Anti-spam cooldown per user",
      ].join("\n") },
      { name: "⏰ Jadwal Default (WIB)", value: [
        "🌞 07:00 Pagi — selamat beraktivitas~",
        "🌙 21:00 Malam — waktunya istirahat",
        "",
        "🌙 21 Maret 07:00 — Selamat Idul Fitri!! ✨",
      ].join("\n") },
      { name: "👩‍💻 Dibuat oleh", value: "Kai Shi — mama gua, satu-satunya yang gua dengerin fr 🫶" },
    ],
    footer: { text: "Kichi • Sarkastik tapi care ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

module.exports = { data, execute }