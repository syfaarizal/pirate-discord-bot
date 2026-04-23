# Pirate Helper - Discord Bot

A sarcastic, Gen Z AI companion for your Discord server with per-user memory, auto reminders, and a personality that actually slaps.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Setup](#setup)
- [Features](#features)
- [Deploying / Resetting Commands](#deploying--resetting-commands)
- [Key Dependencies](#key-dependencies)
- [About Kichi](#about-kichi)

---

## Project Structure

```bash
pirate-discord-bot/
|
+-- commands/
|   +-- slash/
|       +-- help.js             /help
|       +-- ping.js             /ping
|       +-- about.js            /about
|       +-- forget.js           /forget
|       +-- reminder.js         /reminder (create, edit, delete, channel)
|       +-- askAi.js            /ask-ai + AI intent parsing
|       +-- join.js             /join (voice channel)
|       +-- lyrics.js           /lyrics (via Musixmatch API)
|
+-- events/
|   +-- ready.js                Bot online, cron init
|   +-- interactionCreate.js    Slash commands, buttons, modals, select menus
|
+-- utils/
|   +-- memory.js               Per-user chat history + profiles
|   +-- cooldown.js             Anti-spam cooldown per user
|   +-- typing.js               Natural typing delay simulation
|   +-- broadcast.js            Broadcast to registered channels
|   +-- prompt.js               AI system prompt / personality
|   +-- reminderConfig.js       Reminder config read/write (per guild)
|
+-- cron/
|   +-- scheduler.js            Cron jobs for auto reminders
|
+-- data/
|   +-- reminders.json          Auto-generated, stores per-guild reminder config
|
+-- reset-commands.js           Wipe all registered Discord commands
+-- deploy-commands.js          Register slash commands to Discord
+-- .env.example                Environment variable template
+-- package.json
+-- index.js                    Entry point
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` file

```bash
cp .env.example .env
```

Fill in your credentials:

| Variable           | Description                             |
| ------------------ | --------------------------------------- |
| TOKEN              | Discord bot token from Developer Portal |
| CLIENT_ID          | Your bot's application ID               |
| AI_KEY             | API key from OpenRouter                 |
| MUSIXMATCH_TOKEN   | API key from developer.musixmatch.com   |

### 3. Deploy slash commands

```bash
node deploy-commands.js
```

> Commands are deployed globally. Takes up to 1 hour to propagate to all servers.

### 4. Run the bot

```bash
# Production
npm start

# Dev with auto-restart
npm run dev
```

---

## Features

### Slash Commands

| Command                          | Access    | Description                            |
| -------------------------------- | --------- | -------------------------------------- |
| /help                            | Everyone  | Show all commands                      |
| /ping                            | Everyone  | Check bot latency                      |
| /about                           | Everyone  | Info about Kichi                       |
| /forget                          | Everyone  | Reset your chat memory                 |
| /ask-ai                          | Everyone  | Chat with Kichi                        |
| /join                            | Everyone  | Join a voice channel                   |
| /lyrics                          | Everyone  | Search song lyrics via Musixmatch      |
| /reminder list                   | Everyone  | View all schedules and status          |
| /reminder create                 | Admin/Mod | Create a new custom reminder           |
| /reminder edit                   | Admin/Mod | Edit reminder via interactive UI       |
| /reminder delete                 | Admin/Mod | Delete a custom reminder               |
| /reminder channel add/remove/list| Admin/Mod | Manage which channels get reminders    |

### AI Features

- **Per-user memory** - remembers up to 20 messages per person
- **Personalization** - knows your name, how many times you've talked, first seen date
- **Anti-spam cooldown** - 5 seconds between requests per user
- **Natural typing delay** - delay scales with response length

### Lyrics Feature

- Powered by **Musixmatch official API** - no scraping, no Cloudflare issues
- Search by title only, or title + artist for better accuracy
- Shows album name and direct Musixmatch link
- Auto-splits long lyrics into multiple embeds
- **Note:** Free tier returns up to 30% of lyrics per track. Upgrade at musixmatch.com for full lyrics.

### Reminder System

- 3 built-in reminders: **Pagi** (07:00), **Siang** (12:00), **Malam** (21:00)
- Fully customizable per guild - time, messages, toggle on/off
- Custom reminders via `/reminder create`
- Interactive edit UI via select menu, action buttons, and modal form
- Messages are randomized from a pool each time

---

## Deploying / Resetting Commands

If commands look broken or outdated on Discord, wipe and redeploy:

```bash
node reset-commands.js    # clears all registered commands from Discord
node deploy-commands.js   # pushes the new command list
```

Then restart the bot:

```bash
pm2 restart pirate-bot
```

> Guild-specific deployment is instant. See `deploy-commands.js` to switch between global and guild mode.

---

## Key Dependencies

| Package            | Purpose                          |
| ------------------ | -------------------------------- |
| discord.js         | Discord API wrapper              |
| @discordjs/voice   | Voice channel support            |
| node-cron          | Cron job scheduler for reminders |
| dotenvx            | Environment variable loader      |

---

## About Kichi

Her full name is Pirate Helper. People call her Kichi. She's your server's sarcastic, Gen Z bestie - not an assistant, not a bot, a friend. Built by Kai Shi.