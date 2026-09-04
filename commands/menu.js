const settings = require('../settings');

async function menuCommand(sock, chatId, message) {
    const text =
`*🤖 THANUVA-MD — Menu*
Version: ${settings.version} | Prefix: .

*⚙️ General*
- .menu — this menu
- .ping — check bot speed
- .alive — check bot status
- .changelog — what's new
- .help — quick help

*👥 Group Management*
- .ban / .clear — moderation (admin)
- .antilink — toggle link auto-removal
- .antibadword — toggle bad-word filter
- .antitag / .anticall / .antidelete — extra protections

*🛠️ Owner / Config*
- .setup — guided config overview
- .cfgset <key> <value> — stage a setting
- .apply — save staged settings
- .myenv — view current config
- .sudo — manage additional owners
- .channelpost <text> — post to the bot's channel
- .update — self-update from GitHub

*🧩 Custom Commands*
- .addcmd <trigger> | <response>
- .delcmd <trigger>
- .resetcmd — clear all
- .getcmd — list all

*🎨 Fun & Media*
- .sticker — image/video to sticker
- .attp — animated text sticker
- .voice <text> — text to voice note
- .character / .compliment / .dare / .anime
- .chatbot — toggle AI chat mode

_Type any command to use it. Owner-only commands will tell you if you're not authorized._`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = menuCommand;
