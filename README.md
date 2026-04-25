# ⚓ Pirate Helper — Discord Bot

A sarcastic, Gen Z AI companion for your Discord server — with per-user memory, auto reminders, voice capabilities, and a personality that actually slaps.

---

## 📁 Project Structure

```bash
pirate-discord-bot/
│
├── commands/
│   └── slash/
│       ├── registry.js       → Central command registry
│       ├── help.js           → /help
│       ├── ping.js           → /ping
│       ├── about.js          → /about
│       ├── forget.js         → /forget
│       ├── askAi.js          → /ask-ai + AI intent parsing
│       ├── reminder.js       → /reminder (create, edit, delete, channel)
│       ├── join.js           → /join + /leave (voice)
│       ├── speak.js          → /speak (TTS in voice channel)
│       └── lyrics.js         → /lyrics (search song lyrics)
│
├── events/
│   ├── ready.js              → Bot online, cron init
│   ├── interactionCreate.js  → Slash commands, buttons, modals, select menus
│   ├── messageCreate.js      → Mention & reply handler (AI chat)
│   └── voiceState.js         → VC join/leave/auto-leave logic
│
├── services/                 → Business logic layer
│   ├── lyricsService.js      → Lyrics orchestrator (cache, fallback chain)
│   └── providers/
│       ├── genius.js         → Genius API (metadata + search)
│       ├── lyricsOvh.js      → lyrics.ovh (primary lyrics)
│       └── lrclib.js         → LRCLIB (fallback lyrics)
│
├── utils/
│   ├── memory.js             → Per-user chat history + profiles
│   ├── cooldown.js           → Anti-spam cooldown per user
│   ├── typing.js             → Natural typing delay simulation
│   ├── broadcast.js          → Broadcast to registered channels
│   ├── prompt.js             → AI system prompt / personality
│   ├── reminderConfig.js     → Reminder config read/write (per guild)
│   ├── vcState.js            → Voice session state (caller, timers, free mode)
│   └── tts.js                → Text-to-speech via Piper TTS
│
├── cron/
│   └── scheduler.js          → Cron jobs for auto reminders
│
├── data/
│   └── reminders.json        → Auto-generated, per-guild reminder config
│
├── piper/                    → Piper TTS binary + model (not in git)
│   ├── piper                 → Piper binary
│   └── models/
│       └── id_ID-news_tts-medium.onnx
│
├── install-piper.sh          → One-time Piper TTS setup script
├── reset-commands.js         → Wipe all registered Discord commands
├── deploy-commands.js        → Register slash commands to Discord
├── .env.example              → Environment variable template
├── package.json
└── index.js                  → Entry point
```

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` file

```bash
cp .env.example .env
```

Fill in your credentials:

| Variable | Description |
| --- | --- |
| `TOKEN` | Discord bot token from Developer Portal |
| `CLIENT_ID` | Your bot's application ID |
| `AI_KEY` | API key from OpenRouter |
| `GENIUS_TOKEN` | Genius API client access token (for `/lyrics`) |
| `PIPER_BIN` | Path to Piper TTS binary (for `/speak`) |
| `PIPER_MODEL` | Path to Piper voice model (for `/speak`) |
| `STARTUP_CHANNEL_ID` | Text channel ID for bot restart notifications |

### 3. Install Piper TTS (for voice)

```bash
bash install-piper.sh
```

Then add to `.env`:

```bash
PIPER_BIN=/root/piper/piper
PIPER_MODEL=/root/piper/models/id_ID-news_tts-medium.onnx
```

### 4. Set up lyrics service

```bash
mkdir -p services/providers
```

Place the provider files as shown in the project structure above.

### 5. Deploy slash commands

```bash
node deploy-commands.js
```

### 6. Run the bot

```bash
# Production (via PM2)
pm2 start index.js --name pirate-bot

# Dev (auto-restart)
npm run dev
```

---

## 🤖 Features

### Slash Commands

| Command | Who | Description |
| --- | --- | --- |
| `/help` | Everyone | Show all commands |
| `/ping` | Everyone | Check bot latency |
| `/about` | Everyone | Info about Kichi |
| `/forget` | Everyone | Reset your chat memory |
| `/ask-ai` | Everyone | Chat with Kichi — or ask her to create a reminder |
| `/lyrics` | Everyone | Search song lyrics by title + artist |
| `/reminder list` | Everyone | View all schedules + status |
| `/reminder create` | Admin/Mod | Create a new custom reminder |
| `/reminder edit` | Admin/Mod | Edit reminder: toggle, time, messages |
| `/reminder delete` | Admin/Mod | Delete a custom reminder |
| `/reminder channel add/remove/list` | Admin/Mod | Manage reminder channels |
| `/join` | Everyone | Invite Kichi to your current voice channel |
| `/leave` | Caller / Admin/Mod | Kick Kichi out of voice |
| `/speak` | Caller only | Make Kichi say something in VC via TTS |

### AI Features

- **Per-user memory** — remembers up to 20 messages per person
- **Personalization** — knows your name, message count, first seen date
- **Mention & reply** — tag Kichi or reply to her messages to chat, no slash command needed
- **Anti-spam cooldown** — 5 seconds between requests per user
- **Natural typing delay** — scales with response length
- **AI intent parsing** — say *"kichi bikinin reminder jam 9 malam"* in `/ask-ai` and she builds it automatically

### Reminder System

- 3 built-in reminders: **Pagi** (07:00), **Siang** (12:00), **Malam** (21:00)
- Fully customizable per guild — time, messages, toggle on/off
- Custom reminders via `/reminder create`
- Interactive edit UI: select menu → action buttons → modal form
- No `@everyone` — messages are clean and calm
- Messages randomized from a pool each time

### Voice Features

- `/join` — Kichi joins the caller's current VC
- `/leave` — only the caller or admin/mod can kick her out
- `/speak` — TTS via Piper (offline, no API key, Indonesian voice)
- **Auto-leave** — if VC is empty for 30–60 seconds, Kichi leaves on her own
- **Free mode** — if the caller leaves but others remain, anyone can `/join` to become the new controller

### Lyrics

- `/lyrics judul:Yellow artis:Coldplay`
- Genius API for metadata (title, artist, thumbnail)
- lyrics.ovh as primary source → LRCLIB as fallback
- In-memory cache (6 hours) — repeat requests are instant
- Auto-splits long lyrics into multiple embeds
- Filters out translation results automatically

---

## 🔧 Deploying / Resetting Commands

```bash
node reset-commands.js    # wipe all registered commands from Discord
node deploy-commands.js   # push new command list
pm2 restart pirate-bot
```

> Global commands take ~1 hour to propagate. Use `GUILD_ID` in `.env` for instant deployment during testing.

---

## 🏴‍☠️ About Kichi

Her full name is Pirate Helper. People call her Kichi. She's your server's sarcastic, Gen Z bestie — not an assistant, not a bot, a *friend*. Built by Kai Shi.
