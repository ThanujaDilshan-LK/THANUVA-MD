/**
 * THANUVA-MD — runtime configuration commands
 * .setup     — show a guided overview of what can be customized
 * .cfgset  — stage a change (botname, footer, mode, language, online)
 * .apply     — write staged changes into data/botSettings.json + apply live
 * .myenv     — show the bot's current *safe* config (never raw process.env / secrets)
 * .help      — quick help text
 *
 * All five share one settings file so `.cfgset` -> `.apply` behaves like
 * a two-step "stage then commit" flow.
 */

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'botSettings.json');
const PENDING_FILE = path.join(__dirname, '..', 'data', 'pendingSettings.json');

const DEFAULTS = {
    botname: settings.botName || 'THANUVA-MD',
    footer: '• THANUVA-MD •',
    mode: settings.commandMode || 'public',
    language: 'en',
    online: false,
};

// Keys a user is allowed to change via .cfgset — anything not in this
// list is rejected, so this can never be used to overwrite arbitrary
// files or expose something that shouldn't be user-editable.
const EDITABLE_KEYS = ['botname', 'footer', 'mode', 'language', 'online'];

function readJsonSafe(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
        return fallback;
    }
}

function writeJsonSafe(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getCurrentSettings() {
    return { ...DEFAULTS, ...readJsonSafe(SETTINGS_FILE, {}) };
}

// ---------------------------------------------------------------------

async function setupCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can run setup.' }, { quoted: message });
    }
    const current = getCurrentSettings();
    const text =
`*🛠️ THANUVA-MD Setup*

Configure your bot step by step using *.cfgset*, then run *.apply* to save.

*Editable keys:*
- \`botname\` — the bot's display name
- \`footer\` — footer text shown on messages
- \`mode\` — \`public\` or \`admin\` (who can use commands)
- \`language\` — bot reply language code (e.g. en, si)
- \`online\` — \`true\`/\`false\` — always show as online

*Example:*
\`\`\`
.cfgset botname My Bot
.cfgset footer • My Bot •
.apply
\`\`\`

*Current values:*
${EDITABLE_KEYS.map(k => `- ${k}: ${current[k]}`).join('\n')}`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

async function cfgSetCommand(sock, chatId, message, args, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can change settings.' }, { quoted: message });
    }
    const key = (args[0] || '').toLowerCase();
    const value = args.slice(1).join(' ').trim();

    if (!key || !value) {
        return sock.sendMessage(chatId, {
            text: `⚠️ Usage: *.cfgset <key> <value>*\nEditable keys: ${EDITABLE_KEYS.join(', ')}`
        }, { quoted: message });
    }
    if (!EDITABLE_KEYS.includes(key)) {
        return sock.sendMessage(chatId, {
            text: `❌ "${key}" isn't an editable key.\nEditable keys: ${EDITABLE_KEYS.join(', ')}`
        }, { quoted: message });
    }

    const pending = readJsonSafe(PENDING_FILE, {});
    pending[key] = key === 'online' ? (value.toLowerCase() === 'true') : value;
    writeJsonSafe(PENDING_FILE, pending);

    await sock.sendMessage(chatId, {
        text: `✅ Staged: *${key}* → \`${pending[key]}\`\nRun *.apply* to save this change.`
    }, { quoted: message });
}

async function applyCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can apply settings.' }, { quoted: message });
    }
    const pending = readJsonSafe(PENDING_FILE, {});
    if (Object.keys(pending).length === 0) {
        return sock.sendMessage(chatId, { text: 'ℹ️ Nothing staged. Use *.cfgset <key> <value>* first.' }, { quoted: message });
    }

    const current = getCurrentSettings();
    const merged = { ...current, ...pending };
    writeJsonSafe(SETTINGS_FILE, merged);
    writeJsonSafe(PENDING_FILE, {}); // clear staging

    // Apply what can take effect immediately, without a restart
    if (pending.botname) global.botname = pending.botname;

    await sock.sendMessage(chatId, {
        text: `✅ Settings applied:\n${Object.entries(pending).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n_Some changes (like mode) may need a bot restart to fully take effect._`
    }, { quoted: message });
}

async function myenvCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can view config.' }, { quoted: message });
    }
    // Deliberately does NOT dump process.env — that could leak API keys,
    // tokens, or the SESSION_ID into a chat. Only whitelisted, safe
    // bot-level settings are shown here.
    const current = getCurrentSettings();
    const text =
`*⚙️ THANUVA-MD Config*

${EDITABLE_KEYS.map(k => `- ${k}: ${current[k]}`).join('\n')}
- version: ${settings.version}
- ownerNumber: ${settings.ownerNumber}

_Sensitive values (SESSION_ID, API keys) are never shown here for security._`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

async function helpCommand(sock, chatId, message) {
    const text =
`*🆘 THANUVA-MD Help*

- *.menu* — full command list
- *.setup* — guided configuration overview
- *.cfgset <key> <value>* — stage a config change
- *.apply* — save staged changes
- *.myenv* — view current bot config
- *.sudo* — manage additional owners
- *.channelpost <text>* — post to the bot's channel

Need more help? Message the owner directly.`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = {
    setupCommand,
    cfgSetCommand,
    applyCommand,
    myenvCommand,
    helpCommand,
    getCurrentSettings,
};
