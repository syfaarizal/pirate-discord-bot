async function aboutCommand(message) {
  const embed = {
    color: 0x5865f2,
    title: "⚓ Tentang Gua — Pirate Helper",
    description: "Jadi gitu, gua tuh bot Discord yang dibuat buat nemenin kalian. Sarkastik? Iya. Friendly? Juga iya. Kontradiktif? Mungkin.",
    fields: [
      {
        name: "🤖 Powered by",
        value: "GPT-4o Mini via OpenRouter",
        inline: true
      },
      {
        name: "⚙️ Framework",
        value: "Discord.js v14",
        inline: true
      },
      {
        name: "🧠 Kemampuan",
        value: [
          "• Ngobrol santai & sarkastik",
          "• Ingat percakapan per user",
          "• Ngirim reminder otomatis (Ramadhan schedule)",
          "• Anti-spam cooldown",
          "• Punya utility commands",
          "• On/off reminder sesuka hati",
          "• Setting jam reminder juga bisa",
          "• Bahkan jadi temen curhat tentang mantan juga bisa wkwkwk"
        ].join("\n"),
        inline: false
      },
      {
        name: "🌙 Jadwal Aktif",
        value: "Sahur → Subuh → Pagi → Siang → Ngabuburit → Buka → Malam → Tidur",
        inline: false
      }
    ],
    footer: {
      text: "Pirate Helper • Sarkastik tapi care ⚓"
    },
    timestamp: new Date().toISOString()
  }

  return message.reply({ embeds: [embed] })
}

module.exports = { aboutCommand }