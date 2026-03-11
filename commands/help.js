async function helpCommand(message) {
  const embed = {
    color: 0x5865f2,
    title: "⚓ Pirate Helper — Command List",
    description: "Halo! Ini semua yang bisa gua lakuin. Gak banyak sih, tapi ya lumayan lah.",
    fields: [
      {
        name: "🤖 AI Chat",
        value: "`@PirateHelper <pesan>` — Ngobrol sama gua. Tanya apapun, gua jawab (kalau tau).",
        inline: false
      },
      {
        name: "📋 Commands",
        value: [
          "`@PirateHelper help` — Nampilin pesan ini.",
          "`@PirateHelper ping` — Ngecek latency bot.",
          "`@PirateHelper about` — Info tentang gua.",
          "`@PirateHelper forget` — Hapus memory percakapan kita (fresh start).",
          "`@PirateHelper reminder list` — Lihat semua reminder + statusnya.",
          "`@PirateHelper reminder on/off <nama>` — Aktifin/matiin reminder.",
          "`@PirateHelper reminder set <nama> <HH:MM>` — Ubah jam reminder.",
          "`@PirateHelper reminder reset` — Reset semua ke default.",
        ].join("\n"),
        inline: false
      },
      {
        name: "📅 Jadwal Otomatis",
        value: "Gua bakal ngirim pesan otomatis di jam-jam tertentu: sahur, subuh, pagi, siang, ngabuburit, buka puasa, malam, dan tidur.",
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

module.exports = { helpCommand }