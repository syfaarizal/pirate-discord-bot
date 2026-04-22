const { SlashCommandBuilder } = require("discord.js")
const https = require("https")

const GENIUS_TOKEN = process.env.GENIUS_TOKEN

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      let data = ""
      res.on("data", chunk => (data += chunk))
      res.on("end", () => resolve({ status: res.statusCode, body: data }))
    })
    req.on("error", reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("timeout")) })
  })
}

// Search lagu di Genius, return hit pertama
async function searchGenius(query) {
  const encoded = encodeURIComponent(query)
  const url     = `https://api.genius.com/search?q=${encoded}`
  const { body } = await httpsGet(url, {
    "Authorization": `Bearer ${GENIUS_TOKEN}`,
    "User-Agent":    "PirateHelper/1.0",
  })

  const data = JSON.parse(body)
  const hits  = data?.response?.hits || []
  const song  = hits.find(h => h.type === "song")?.result

  if (!song) return null
  return {
    id:        song.id,
    title:     song.title,
    artist:    song.primary_artist?.name || "Unknown",
    url:       song.url,
    thumbnail: song.song_art_image_thumbnail_url || null,
    header:    song.header_image_thumbnail_url || null,
  }
}

// Scrape lirik dari halaman Genius
// Genius API v3 tidak expose lirik langsung — harus scrape HTML-nya
async function scrapeLyrics(geniusUrl) {
  const { body } = await httpsGet(geniusUrl, {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept":     "text/html",
  })

  // Genius nyimpen lirik di JSON tag window.__PRELOADED_STATE__
  const match = body.match(/window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\('(.+?)'\);/)
  if (match) {
    try {
      const raw     = match[1].replace(/\\'/g, "'").replace(/\\"/g, '"')
      const decoded = JSON.parse(JSON.parse(`"${raw}"`))
      const lyricsData = decoded?.entities?.lyrics
      if (lyricsData) {
        const lyricsKey = Object.keys(lyricsData)[0]
        const html = lyricsData[lyricsKey]?.body?.html || ""
        return stripHtml(html)
      }
    } catch { /* fall through ke method lain */ }
  }

  // Fallback: ambil dari tag data-lyrics-container
  const containerMatches = body.match(/data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g)
  if (containerMatches) {
    return containerMatches
      .map(block => stripHtml(block))
      .join("\n\n")
      .trim()
  }

  return null
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Split lirik jadi beberapa chunk kalau lebih dari 4096 karakter (batas embed)
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

  const judul  = interaction.options.getString("judul").trim()
  const artis  = interaction.options.getString("artis")?.trim() || ""
  const query  = artis ? `${judul} ${artis}` : judul

  await interaction.deferReply()

  try {
    // 1. Search
    const song = await searchGenius(query)
    if (!song) {
      return interaction.editReply(`gak ketemu lagu **${query}** di Genius. coba cek spelling-nya.`)
    }

    // 2. Scrape lirik
    const lyrics = await scrapeLyrics(song.url)
    if (!lyrics) {
      return interaction.editReply(
        `ketemu lagunya (**${song.title}** — ${song.artist}) tapi liriknya gak bisa diambil.\n🔗 ${song.url}`
      )
    }

    // 3. Split kalau panjang
    const chunks = chunkLyrics(lyrics)
    const color  = 0x5865f2

    // Embed pertama — header + chunk pertama
    const firstEmbed = {
      color,
      author: {
        name: song.artist,
      },
      title:       `🎵 ${song.title}`,
      url:          song.url,
      description:  chunks[0],
      thumbnail:    song.thumbnail ? { url: song.thumbnail } : undefined,
      footer: chunks.length > 1
        ? { text: `Halaman 1/${chunks.length} • via Genius` }
        : { text: "via Genius" },
    }

    await interaction.editReply({ embeds: [firstEmbed] })

    // Kalau ada chunk tambahan, kirim sebagai followUp
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