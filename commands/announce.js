/**
 * THANUVA-MD — auto-announce updates
 *
 * Compares the running settings.version against the last version we
 * announced. If it's different (i.e. the bot was just updated via
 * .update and restarted), it posts a short notice to:
 *   - the bot's WhatsApp channel (CHANNEL_JID)
 *   - every group listed in data/announceGroups.json
 *
 * Call announceUpdateIfNew(sock) once, after connection === 'open'.
 */

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const STATE_FILE = path.join(__dirname, '..', 'data', 'lastAnnouncedVersion.json');
const GROUPS_FILE = path.join(__dirname, '..', 'data', 'announceGroups.json');
const CHANNEL_JID = '120363161513685998@newsletter'; // update once you have the real ID

function readJsonSafe(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch (e) { return fallback; }
}

function writeJsonSafe(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function announceUpdateIfNew(sock) {
    const state = readJsonSafe(STATE_FILE, { version: null });

    // First-ever boot: just record the current version, don't announce.
    if (!state.version) {
        writeJsonSafe(STATE_FILE, { version: settings.version });
        return;
    }

    if (state.version === settings.version) return; // nothing new

    const text =
`*🎉 THANUVA-MD Updated!*

Now running version *${settings.version}* (was ${state.version}).
Type *.changelog* to see what's new. ✨`;

    // Post to the channel (bot account must be admin/owner of it)
    try {
        await sock.sendMessage(CHANNEL_JID, { text });
    } catch (e) {
        console.error('[announce] Could not post to channel:', e.message);
    }

    // Post to every configured group
    const groups = readJsonSafe(GROUPS_FILE, []);
    for (const groupJid of groups) {
        try {
            await sock.sendMessage(groupJid, { text });
        } catch (e) {
            console.error(`[announce] Could not post to group ${groupJid}:`, e.message);
        }
    }

    writeJsonSafe(STATE_FILE, { version: settings.version });
}

module.exports = { announceUpdateIfNew };
