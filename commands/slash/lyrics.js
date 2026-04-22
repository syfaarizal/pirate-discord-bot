const { SlashCommandBuilder } = require("discord.js")
const getLyrics = require("lyrics-finder")

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Split lirik jadi chunks kalau lebih dari 4000 karakter
function chunkLyrics(lyrics, maxLen = 4000) {
  const chunks = []
  const lines  = lyrics.split("\n")
  let current  = ""

  for (const line of lines) {
    if ((current + "\n" + line).length > maxLen) {
      chunks.push(current.trim())
      current = line
    } else {
      current += (current ? "\n" : "") + line
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

// ─────────────────────────────────────────────
// Command
// ─────────────────────────────────────────────

const data = new SlashCommandBuilder()
  .setName("lyrics")
  .setDescription("Cari lirik lagu")
  .addStringOption(opt => opt
    .setName("judul")
    .setDescription("Judul lagu (contoh: Blinding Lights)")
    .setRequired(true)
    .setMaxLength(100)
  )
  .addStringOption(opt => opt
    .setName("artis")
    .setDescription("Nama artis (opsional tapi lebih akurat)")
    .setRequired(false)
    .setMaxLength(100)
  )

async function execute(interaction) {
  const judul = interaction.options.getString("judul").trim()
  const artis = interaction.options.getString("artis")?.trim() || ""

  await interaction.deferReply()

  try {
    const lyrics = await getLyrics(judul, artis)

    if (!lyrics || lyrics.trim().length === 0) {
      return interaction.editReply(
        `gak ketemu lirik untuk **${judul}${artis ? ` — ${artis}` : ""}**.\ncoba cek spelling atau tambahkan nama artisnya.`
      )
    }

    const chunks    = chunkLyrics(lyrics)
    const color     = 0x5865f2
    const titleDisplay = artis ? `${judul} — ${artis}` : judul

    // Embed pertama — header + lirik chunk pertama
    await interaction.editReply({
      embeds: [{
        color,
        title: `🎵 ${titleDisplay}`,
        description: chunks[0],
        footer: {
          text: chunks.length > 1
            ? `Halaman 1/${chunks.length} • via AZLyrics`
            : "via AZLyrics"
        },
      }],
    })

    // Followup kalau lirik panjang
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({
        embeds: [{
          color,
          description: chunks[i],
          footer: { text: `Halaman ${i + 1}/${chunks.length} • via AZLyrics` },
        }],
      })
    }

  } catch (err) {
    console.error("[Lyrics Error]", err)
    return interaction.editReply("gagal ambil lirik nih, coba lagi bentar.")
  }
}

module.exports = { data, execute }