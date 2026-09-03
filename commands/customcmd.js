/**
 * THANUVA-MD — Custom Commands system
 * .addcmd <trigger> | <response>   — add a custom command (owner/sudo only)
 * .delcmd <trigger>                — remove one custom command
 * .resetcmd                        — clear all custom commands
 * .getcmd                          — list all custom commands
 * matchCustomCommand(text)         — called from the main message handler
 *                                    to check if incoming text matches a
 *                                    custom trigger, and reply if so.
 */

const fs = require('fs');
const path = require('path');

const CUSTOM_CMDS_FILE = path.join(__dirname, '..', 'data', 'customCommands.json');

function readCommands() {
    try {
        return JSON.parse(fs.readFileSync(CUSTOM_CMDS_FILE, 'utf-8'));
    } catch (e) {
        return {};
    }
}

function writeCommands(cmds) {
    fs.mkdirSync(path.dirname(CUSTOM_CMDS_FILE), { recursive: true });
    fs.writeFileSync(CUSTOM_CMDS_FILE, JSON.stringify(cmds, null, 2));
}

async function addCmdCommand(sock, chatId, message, userMessage, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can add custom commands.' }, { quoted: message });
    }

    // Expected format: .addcmd trigger | response text
    const body = userMessage.replace(/^\.addcmd\s*/i, '');
    const [triggerRaw, ...rest] = body.split('|');
    const trigger = (triggerRaw || '').trim().toLowerCase();
    const response = rest.join('|').trim();

    if (!trigger || !response) {
        return sock.sendMessage(chatId, {
            text: '⚠️ Usage: *.addcmd <trigger> | <response>*\nExample: *.addcmd hello | Hi there! 👋*'
        }, { quoted: message });
    }

    const builtInPrefixes = ['menu', 'help', 'setup', 'settings', 'apply', 'myenv', 'sudo', 'update', 'channelpost', 'ban', 'clear', 'alive'];
    if (builtInPrefixes.includes(trigger)) {
        return sock.sendMessage(chatId, {
            text: `❌ "${trigger}" is a built-in command and can't be overridden.`
        }, { quoted: message });
    }

    const cmds = readCommands();
    cmds[trigger] = response;
    writeCommands(cmds);

    await sock.sendMessage(chatId, {
        text: `✅ Custom command added:\n*.${trigger}* → ${response}`
    }, { quoted: message });
}

async function delCmdCommand(sock, chatId, message, userMessage, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can delete custom commands.' }, { quoted: message });
    }

    const trigger = userMessage.replace(/^\.delcmd\s*/i, '').trim().toLowerCase();
    if (!trigger) {
        return sock.sendMessage(chatId, { text: '⚠️ Usage: *.delcmd <trigger>*' }, { quoted: message });
    }

    const cmds = readCommands();
    if (!cmds[trigger]) {
        return sock.sendMessage(chatId, { text: `❌ No custom command named "${trigger}" found.` }, { quoted: message });
    }

    delete cmds[trigger];
    writeCommands(cmds);
    await sock.sendMessage(chatId, { text: `🗑️ Removed custom command: *.${trigger}*` }, { quoted: message });
}

async function resetCmdCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can reset custom commands.' }, { quoted: message });
    }
    writeCommands({});
    await sock.sendMessage(chatId, { text: '🗑️ All custom commands cleared.' }, { quoted: message });
}

async function getCmdCommand(sock, chatId, message) {
    const cmds = readCommands();
    const keys = Object.keys(cmds);
    if (keys.length === 0) {
        return sock.sendMessage(chatId, { text: 'ℹ️ No custom commands set up yet. Use *.addcmd* to create one.' }, { quoted: message });
    }
    const list = keys.map(k => `• *.${k}* → ${cmds[k]}`).join('\n');
    await sock.sendMessage(chatId, { text: `*📋 Custom Commands*\n\n${list}` }, { quoted: message });
}

/**
 * Call this from the main message handler for any incoming text that
 * starts with '.' and didn't match a built-in command. Returns true if
 * it handled (and replied to) the message, false otherwise.
 *
 * Example wiring in main.js, inside the default/fallback case of your
 * command switch statement:
 *
 *   default:
 *       const handled = await matchCustomCommand(sock, chatId, message, userMessage);
 *       break;
 */
async function matchCustomCommand(sock, chatId, message, userMessage) {
    if (!userMessage.startsWith('.')) return false;
    const trigger = userMessage.slice(1).split(' ')[0].toLowerCase();
    const cmds = readCommands();
    if (!cmds[trigger]) return false;

    await sock.sendMessage(chatId, { text: cmds[trigger] }, { quoted: message });
    return true;
}

module.exports = {
    addCmdCommand,
    delCmdCommand,
    resetCmdCommand,
    getCmdCommand,
    matchCustomCommand,
};
