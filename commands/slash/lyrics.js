const { SlashCommandBuilder } = require("discord.js")
const { getLyrics }           = require("../../services/lyricsService")

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

function footerText({ source, warning, fromCache, page, total }) {
  const parts = []
  if (total > 1) parts.push(`Halaman ${page}/${total}`)
  if (source)    parts.push(`via ${source}`)
  if (warning)   parts.push("⚠️ lirik mungkin tidak lengkap")
  if (fromCache) parts.push("📦 cached")
  return parts.join(" • ") || "Lyrics"
}

// ─────────────────────────────────────────────
// Command
// ─────────────────────────────────────────────

const data = new SlashCommandBuilder()
  .setName("lyrics")
  .setDescription("Cari lirik lagu")
  .addStringOption(opt => opt
    .setName("judul")
    .setDescription("Judul lagu (contoh: Yellow)")
    .setRequired(true)
    .setMaxLength(100)
  )
  .addStringOption(opt => opt
    .setName("artis")
    .setDescription("Nama artis — opsional tapi lebih akurat (contoh: Coldplay)")
    .setRequired(false)
    .setMaxLength(100)
  )

async function execute(interaction) {
  const judul = interaction.options.getString("judul").trim()
  const artis = interaction.options.getString("artis")?.trim() || ""

  await interaction.deferReply()

  const result = await getLyrics(judul, artis)

  if (!result.lyrics) {
    const embed = {
      color: 0xed4245,
      title: `🔍 ${result.title}`,
      description: [
        `gak ketemu liriknya buat **${result.title}**${result.artist ? ` — ${result.artist}` : ""}.`,
        result.geniusUrl ? `\n🔗 [Lihat di Genius](${result.geniusUrl})` : "",
      ].join(""),
      footer: { text: "Coba tambahkan nama artis biar lebih akurat." },
    }
    return interaction.editReply({ embeds: [embed] })
  }

  const chunks = chunkLyrics(result.lyrics)
  const color  = 0x5865f2
  const meta   = { source: result.source, warning: result.warning, fromCache: result.fromCache }

  // Embed pertama — ada header lengkap
  const firstEmbed = {
    color,
    author:      { name: result.artist },
    title:       `🎵 ${result.title}`,
    url:         result.geniusUrl || undefined,
    description: chunks[0],
    thumbnail:   result.thumbnail ? { url: result.thumbnail } : undefined,
    footer:      { text: footerText({ ...meta, page: 1, total: chunks.length }) },
  }

  await interaction.editReply({ embeds: [firstEmbed] })

  // Chunk tambahan sebagai follow-up
  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({
      embeds: [{
        color,
        description: chunks[i],
        footer: { text: footerText({ ...meta, page: i + 1, total: chunks.length }) },
      }],
    })
  }
}

module.exports = { data, execute }