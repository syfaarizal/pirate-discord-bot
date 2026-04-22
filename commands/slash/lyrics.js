const { SlashCommandBuilder } = require("discord.js")
const Genius = require("genius-lyrics")

const GENIUS_TOKEN = process.env.GENIUS_TOKEN

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Kata-kata yang nandain bukan lagu asli — translation, cover, dll
const JUNK_KEYWORDS = [
  "übersetzung", "traduction", "traduccion", "traducción",
  "перевод", "tradução", "traduzione", "translation",
  "terjemahan", "letra", "lirik terjemahan",
  "karaoke", "instrumental", "cover", "remix",
  "deutsche", "french", "russian", "spanish", "italian",
]

function isJunk(title, artist) {
  const lower = `${title} ${artist}`.toLowerCase()
  return JUNK_KEYWORDS.some(k => lower.includes(k))
}

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
  .setDescription("Cari lirik lagu via Genius")
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
  if (!GENIUS_TOKEN) {
    return interaction.reply({
      content: "⚠️ `GENIUS_TOKEN` belum di-set di `.env`. Daftar di genius.com/api-clients.",
      ephemeral: true,
    })
  }

  const judul = interaction.options.getString("judul").trim()
  const artis = interaction.options.getString("artis")?.trim() || ""
  const query = artis ? `${judul} ${artis}` : judul

  await interaction.deferReply()

  try {
    const client  = new Genius.Client(GENIUS_TOKEN)
    const results = await client.songs.search(query)

    if (!results || results.length === 0) {
      return interaction.editReply(`gak ketemu lagu **${query}** di Genius. coba cek spelling-nya.`)
    }

    // Ambil hasil pertama yang bukan junk (translation/cover/dll)
    const song = results.find(s => !isJunk(s.title, s.artist?.name || ""))
      ?? results[0]  // fallback ke pertama kalau semua junk

    // Fetch lirik
    const lyrics = await song.lyrics()

    if (!lyrics || lyrics.trim().length === 0) {
      return interaction.editReply(
        `ketemu lagunya (**${song.title}** — ${song.artist?.name}) tapi liriknya gak ada.\n🔗 ${song.url}`
      )
    }

    const chunks    = chunkLyrics(lyrics)
    const color     = 0x5865f2
    const artistName = song.artist?.name || "Unknown"
    const thumbnail  = song.image || null

    // Embed pertama — header + lirik chunk pertama
    await interaction.editReply({
      embeds: [{
        color,
        author:      { name: artistName },
        title:       `🎵 ${song.title}`,
        url:          song.url,
        description:  chunks[0],
        thumbnail:    thumbnail ? { url: thumbnail } : undefined,
        footer: {
          text: chunks.length > 1
            ? `Halaman 1/${chunks.length} • via Genius`
            : "via Genius"
        },
      }],
    })

    // Followup kalau lirik panjang
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({
        embeds: [{
          color,
          description: chunks[i],
          footer: { text: `Halaman ${i + 1}/${chunks.length} • via Genius` },
        }],
      })
    }

  } catch (err) {
    console.error("[Lyrics Error]", err)
    return interaction.editReply("gagal ambil lirik nih, coba lagi bentar.")
  }
}

module.exports = { data, execute }