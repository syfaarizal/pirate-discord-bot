const { SlashCommandBuilder } = require("discord.js")

const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Info tentang Pirate Helper")

async function execute(interaction) {
  const embed = {
    color: 0x5865f2,
    title: "⚓ Tentang Gua — Pirate Helper",
    description: "Gua tuh bot Discord yang dibuat buat nemenin kalian. Sarkastik? Iya. Friendly? Juga iya. Kontradiktif? Mungkin.",
    fields: [
      { name: "🤖 Powered by",   value: "GPT-4o Mini via OpenRouter", inline: true },
      { name: "⚙️ Framework",    value: "Discord.js v14",             inline: true },
      { name: "🧠 Kemampuan", value: [
        "• Ngobrol santai & sarkastik pakai `/ask-ai`",
        "• Ingat percakapan per user (dalam satu sesi)",
        "• Ngirim reminder otomatis per server",
        "• Jadwal reminder bisa di-custom per server",
        "• Anti-spam cooldown per user",
      ].join("\n") },
      { name: "⏰ Jadwal Default (WIB)", value: [
        "🌙 03:30 Sahur  •  😴 04:45 Subuh",
        "🌞 07:00 Pagi   •  😴 12:00 Siang",
        "🌤 16:30 Ngabuburit  •  🌇 18:00 Buka",
        "🌙 21:00 Malam  •  😴 23:30 Tidur",
      ].join("\n") },
    ],
    footer: { text: "Pirate Helper • Sarkastik tapi care ⚓" },
    timestamp: new Date().toISOString()
  }

  return interaction.reply({ embeds: [embed] })
}

module.exports = { data, execute }