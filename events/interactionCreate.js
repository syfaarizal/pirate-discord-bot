const commandModules = {
  "help":                 () => require("../commands/slash/help"),
  "ping":                 () => require("../commands/slash/ping"),
  "about":                () => require("../commands/slash/about"),
  "forget":               () => require("../commands/slash/forget"),
  "reminder":             () => require("../commands/slash/reminder"),
  "set-reminder-channel": () => require("../commands/slash/setReminderChannel"),
  "ask-ai":               () => require("../commands/slash/askAi"),
}

async function onInteractionCreate(interaction) {
  if (!interaction.isChatInputCommand()) return

  const loader = commandModules[interaction.commandName]
  if (!loader) return

  try {
    const { execute } = loader()
    await execute(interaction)
  } catch (err) {
    console.error(`[Interaction Error] /${interaction.commandName}:`, err)
    const msg = "Aduh, ada error nih 💀 Coba lagi bentar ya."
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg).catch(() => {})
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {})
    }
  }
}

module.exports = { onInteractionCreate }