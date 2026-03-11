const { helpCommand } = require("./help")
const { pingCommand } = require("./ping")
const { aboutCommand } = require("./about")
const { forgetCommand } = require("./forget")

// Map keyword -> handler function
const COMMANDS = {
  help: (msg, client) => helpCommand(msg, client),
  ping: (msg, client) => pingCommand(msg, client),
  about: (msg, client) => aboutCommand(msg, client),
  forget: (msg, client) => forgetCommand(msg, client),
}

/**
 * Cek apakah prompt adalah sebuah command.
 * Kalau iya, jalankan dan return true. Kalau bukan, return false.
 *
 * @param {string} prompt - cleaned message content
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 * @returns {boolean}
 */
async function handleCommand(prompt, message, client) {
  const firstWord = prompt.split(/\s+/)[0].toLowerCase()

  if (COMMANDS[firstWord]) {
    await COMMANDS[firstWord](message, client)
    return true
  }

  return false
}

module.exports = { handleCommand }