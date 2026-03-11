# ⚓ Pirate Helper — Discord Bot

Bot Discord sarkastik, friendly, bertenaga AI — dengan jadwal otomatis Ramadhan dan memory per user.

---

## 📁 Struktur Proyek

```
pirate-discord-bot/
│
├── commands/
│   ├── index.js      → Command router
│   ├── help.js       → Command: @bot help
│   ├── ping.js       → Command: @bot ping
│   ├── about.js      → Command: @bot about
│   └── forget.js     → Command: @bot forget
│
├── events/
│   ├── ready.js      → Event: bot online
│   └── messageCreate.js → Event: pesan masuk + AI handler
│
├── utils/
│   ├── memory.js     → Memory per user (history chat + profil)
│   ├── cooldown.js   → Anti-spam cooldown per user
│   ├── typing.js     → Natural typing delay
│   ├── broadcast.js  → Broadcast ke semua channel
│   └── prompt.js     → System prompt kepribadian AI
│
├── cron/
│   └── scheduler.js  → Semua jadwal pesan otomatis
│
├── .env.example      → Template environment variables
├── package.json
└── index.js          → Entry point
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file `.env`
```bash
cp .env.example .env
```
Isi dengan token dan API key kamu.

### 3. Jalankan bot
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

---

## 🤖 Fitur

### Commands
| Command | Fungsi |
|---|---|
| `@bot help` | Nampilin semua command |
| `@bot ping` | Cek latency bot |
| `@bot about` | Info tentang bot |
| `@bot forget` | Reset memory percakapan |
| `@bot <pesan>` | Ngobrol sama AI |

### AI Features
- **Memory per user** — bot ingat 20 pesan terakhir per orang
- **Personalisasi** — bot sebut nama user, tau ini percakapan ke berapa
- **Natural typing delay** — delay dihitung dari panjang respons
- **Anti-spam cooldown** — 5 detik cooldown per user
- **Sarkastik tapi friendly** — karakter Gen Z yang asik

### Jadwal Otomatis (WIB)
| Jam | Event |
|---|---|
| 03:30 | 🌙 Sahur |
| 04:45 | 😴 Habis Subuh |
| 07:00 | 🌞 Pagi |
| 12:00 | 😴 Siang |
| 16:30 | 🌤 Ngabuburit |
| 18:00 | 🌇 Buka Puasa |
| 21:00 | 🌙 Malam |
| 23:30 | 😴 Tidur |

---

## ⚙️ Environment Variables

| Variable | Keterangan |
|---|---|
| `TOKEN` | Discord bot token dari Developer Portal |
| `AI_KEY` | API key dari OpenRouter |
| `CHANNEL_IDS` | Channel IDs untuk broadcast, pisah koma |