const {
  handleEditSelectMenu,
  handleToggleButton,
  handleSetTimeModal,
  handleSetTimeSubmit,
  handleAddTextModal,
  handleAddTextSubmit,
  handleRemoveTextModal,
  handleRemoveTextSubmit,
} = require("../commands/slash/reminder")

const { executeJoin, executeLeave } = require("../commands/slash/join")

const commandModules = {
  "help":     () => require("../commands/slash/help"),
  "ping":     () => require("../commands/slash/ping"),
  "about":    () => require("../commands/slash/about"),
  "forget":   () => require("../commands/slash/forget"),
  "reminder": () => require("../commands/slash/reminder"),
  "ask-ai":   () => require("../commands/slash/askAi"),
  "join":     () => ({ execute: executeJoin }),
  "leave":    () => ({ execute: executeLeave }),
}

const { PermissionFlagsBits } = require("discord.js")

function isAdminOrMod(member) {
  if (!member) return false
  if (member.guild.ownerId === member.id) return true
  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) return true
  return member.roles.cache.some(r => {
    const n = r.name.toLowerCase()
    return n.includes("admin") || n.includes("mod")
  })
}

function denyNonAdmin(interaction) {
  return interaction.reply({
    content: "🔒 Lu gak punya akses buat ini.",
    ephemeral: true,
  })
}

async function onInteractionCreate(interaction) {

  // ── Slash Commands ──
  if (interaction.isChatInputCommand()) {
    const loader = commandModules[interaction.commandName]
    if (!loader) return
    try {
      const { execute } = loader()
      await execute(interaction)
    } catch (err) {
      console.error(`[Slash Error] /${interaction.commandName}:`, err)
      const msg = "Aduh, ada error nih 💀 Coba lagi bentar ya."
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg).catch(() => {})
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {})
      }
    }
    return
  }

  // ── Select Menus ──
  if (interaction.isStringSelectMenu()) {
    if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

    if (interaction.customId === "reminder_edit_select") {
      try {
        await handleEditSelectMenu(interaction)
      } catch (err) {
        console.error("[SelectMenu Error] reminder_edit_select:", err)
        await interaction.update({ content: "Error pas ngeproses pilihan.", components: [] }).catch(() => {})
      }
    }
    return
  }

  // ── Buttons ──
  if (interaction.isButton()) {
    if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

    const [action, key] = interaction.customId.split(":")

    try {
      if (action === "reminder_toggle")     return await handleToggleButton(interaction, key)
      if (action === "reminder_settime")    return await handleSetTimeModal(interaction, key)
      if (action === "reminder_addtext")    return await handleAddTextModal(interaction, key)
      if (action === "reminder_removetext") return await handleRemoveTextModal(interaction, key)
    } catch (err) {
      console.error(`[Button Error] ${interaction.customId}:`, err)
      await interaction.reply({ content: "Error pas ngeproses button.", ephemeral: true }).catch(() => {})
    }
    return
  }

  // ── Modals ──
  if (interaction.isModalSubmit()) {
    if (!isAdminOrMod(interaction.member)) return denyNonAdmin(interaction)

    const [action, key] = interaction.customId.split(":")

    try {
      if (action === "reminder_settime_submit")    return await handleSetTimeSubmit(interaction, key)
      if (action === "reminder_addtext_submit")    return await handleAddTextSubmit(interaction, key)
      if (action === "reminder_removetext_submit") return await handleRemoveTextSubmit(interaction, key)
    } catch (err) {
      console.error(`[Modal Error] ${interaction.customId}:`, err)
      await interaction.reply({ content: "Error pas ngeproses form.", ephemeral: true }).catch(() => {})
    }
    return
  }
}

module.exports = { onInteractionCreate }