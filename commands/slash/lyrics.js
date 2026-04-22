const { SlashCommandBuilder } = require("discord.js")

const MUSIXMATCH_TOKEN = process.env.MUSIXMATCH_TOKEN
const BASE_URL = "https://api.musixmatch.com/ws/1.1"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function searchTrack(title, artist) {
  const params = new URLSearchParams({
    q_track:         title,
    q_artist:        artist || "",
    page_size:       "5",
    page:            "1",
    s_track_rating:  "desc",
    apikey:          MUSIXMATCH_TOKEN,
  })

  const res  = await fetch(`${BASE_URL}/track.search?${params}`)
  const json = await res.json()

  const status = json?.message?.header?.status_code
  if (status !== 200) throw new Error(`Musixmatch search error: ${status}`)

  const tracks = json?.message?.body?.track_list
  if (!tracks || tracks.length === 0) return null

  return tracks[0].track
}

async function getLyrics(trackId) {
  const params = new URLSearchParams({
    track_id: trackId,
    apikey:   MUSIXMATCH_TOKEN,
  })

  const res  = await fetch(`${BASE_URL}/track.lyrics.get?${params}`)
  const json = await res.json()

  const status = json?.message?.header?.status_code
  if (status !== 200) throw new Error(`Musixmatch lyrics error: ${status}`)

  return json?.message?.body?.lyrics?.lyrics_body || null
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

// Buang watermark Musixmatch di akhir lirik
function cleanLyrics(lyrics) {
  return lyrics
    .replace(/\*{7}.*?\*{7}/gs, "")  // ******* This Lyrics is NOT for Posting *******
    .replace(/This Lyrics is NOT.*$/gim, "")
    .replace(/\(\d+ more lines\).*$/gim, "") // "(42 more lines)" di free tier
    .trim()
}

// ─────────────────────────────────────────────
// Command
// ─────────────────────────────────────────────

const data = new SlashCommandBuilder()
  .setName("lyrics")
  .setDescription("Cari lirik lagu via Musixmatch")
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
  if (!MUSIXMATCH_TOKEN) {
    return interaction.reply({
      content: "⚠️ `MUSIXMATCH_TOKEN` belum di-set di `.env`. Daftar di developer.musixmatch.com.",
      ephemeral: true,
    })
  }

  const judul = interaction.options.getString("judul").trim()
  const artis = interaction.options.getString("artis")?.trim() || ""

  await interaction.deferReply()

  try {
    // 1. Cari lagu
    const track = await searchTrack(judul, artis)

    if (!track) {
      return interaction.editReply(
        `gak ketemu lagu **${judul}${artis ? ` — ${artis}` : ""}** di Musixmatch.\ncoba cek spelling atau tambahkan nama artisnya.`
      )
    }

    const trackName   = track.track_name
    const artistName  = track.artist_name
    const trackId     = track.track_id
    const albumName   = track.album_name || null
    const trackUrl    = track.track_share_url || null

    // 2. Ambil lirik
    const rawLyrics = await getLyrics(trackId)

    if (!rawLyrics || rawLyrics.trim().length === 0) {
      return interaction.editReply(
        `ketemu lagunya (**${trackName}** — ${artistName}) tapi liriknya gak tersedia.\n${trackUrl ? `🔗 ${trackUrl}` : ""}`
      )
    }

    const lyrics = cleanLyrics(rawLyrics)

    // Cek apakah lirik terpotong (free tier limit)
    const isTruncated = rawLyrics.includes("more lines")

    const chunks       = chunkLyrics(lyrics)
    const color        = 0x5865f2
    const titleDisplay = `${trackName} — ${artistName}`

    // Embed pertama
    await interaction.editReply({
      embeds: [{
        color,
        title:       `🎵 ${titleDisplay}`,
        url:          trackUrl || undefined,
        description:  chunks[0],
        ...(albumName ? { fields: [{ name: "Album", value: albumName, inline: true }] } : {}),
        footer: {
          text: [
            chunks.length > 1 ? `Halaman 1/${chunks.length}` : null,
            isTruncated ? "⚠️ Lirik terpotong (free tier limit)" : null,
            "via Musixmatch",
          ].filter(Boolean).join(" • "),
        },
      }],
    })

    // Followup kalau lirik panjang
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({
        embeds: [{
          color,
          description: chunks[i],
          footer: {
            text: [
              `Halaman ${i + 1}/${chunks.length}`,
              "via Musixmatch",
            ].join(" • "),
          },
        }],
      })
    }

  } catch (err) {
    console.error("[Lyrics Error]", err)
    return interaction.editReply("gagal ambil lirik nih, coba lagi bentar.")
  }
}

module.exports = { data, execute }