const help = require("./help")
const ping = require("./ping")
const about = require("./about")
const forget = require("./forget")
const reminder = require("./reminder")
const askAi = require("./askAi")
const { joinData, leaveData, executeJoin, executeLeave } = require("./join")

const slashCommands = [
  { name: help.data.name, data: help.data, execute: help.execute },
  { name: ping.data.name, data: ping.data, execute: ping.execute },
  { name: about.data.name, data: about.data, execute: about.execute },
  { name: forget.data.name, data: forget.data, execute: forget.execute },
  { name: reminder.data.name, data: reminder.data, execute: reminder.execute },
  { name: askAi.data.name, data: askAi.data, execute: askAi.execute },
  { name: joinData.name, data: joinData, execute: executeJoin },
  { name: leaveData.name, data: leaveData, execute: executeLeave },
]

function getCommandMap() {
  return slashCommands.reduce((acc, cmd) => {
    // Guard against accidental duplicate aliases/names.
    if (!acc[cmd.name]) acc[cmd.name] = cmd
    return acc
  }, {})
}

module.exports = {
  slashCommands,
  getCommandMap,
}
