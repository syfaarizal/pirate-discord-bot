const help     = require("./help")
const ping     = require("./ping")
const about    = require("./about")
const forget   = require("./forget")
const reminder = require("./reminder")
const askAi    = require("./askAi")
const lyrics   = require("./lyrics")
const { joinData, leaveData, executeJoin, executeLeave } = require("./join")
const { speakData, executeSpeak }                        = require("./speak")

const slashCommands = [
  { name: help.data.name,     data: help.data,     execute: help.execute },
  { name: ping.data.name,     data: ping.data,     execute: ping.execute },
  { name: about.data.name,    data: about.data,    execute: about.execute },
  { name: forget.data.name,   data: forget.data,   execute: forget.execute },
  { name: reminder.data.name, data: reminder.data, execute: reminder.execute },
  { name: askAi.data.name,    data: askAi.data,    execute: askAi.execute },
  { name: lyrics.data.name,   data: lyrics.data,   execute: lyrics.execute },
  { name: joinData.name,      data: joinData,       execute: executeJoin },
  { name: leaveData.name,     data: leaveData,      execute: executeLeave },
  { name: speakData.name,     data: speakData,      execute: executeSpeak },
]

function getCommandMap() {
  return slashCommands.reduce((acc, cmd) => {
    if (!acc[cmd.name]) acc[cmd.name] = cmd
    return acc
  }, {})
}

module.exports = { slashCommands, getCommandMap }