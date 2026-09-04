const fs = require('fs');
const path = require('path');

const GROUPS_FILE = path.join(__dirname, '..', 'data', 'announceGroups.json');

function readGroups() {
    try { return JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf-8')); } catch (e) { return []; }
}
function writeGroups(groups) {
    fs.mkdirSync(path.dirname(GROUPS_FILE), { recursive: true });
    fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
}

// Run this command inside the group you want added — it uses chatId
// automatically, so you don't need to type out the group JID by hand.
async function addAnnounceGroupCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: message });
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '⚠️ Run this inside the group you want to add.' }, { quoted: message });

    const groups = readGroups();
    if (groups.includes(chatId)) {
        return sock.sendMessage(chatId, { text: 'ℹ️ This group is already on the announce list.' }, { quoted: message });
    }
    groups.push(chatId);
    writeGroups(groups);
    await sock.sendMessage(chatId, { text: '✅ This group will now receive update announcements.' }, { quoted: message });
}

async function removeAnnounceGroupCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: message });

    const groups = readGroups().filter(g => g !== chatId);
    writeGroups(groups);
    await sock.sendMessage(chatId, { text: '🗑️ This group removed from the announce list.' }, { quoted: message });
}

async function listAnnounceGroupsCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: message });

    const groups = readGroups();
    const text = groups.length
        ? `*📋 Announce Groups (${groups.length})*\n${groups.map(g => `- ${g}`).join('\n')}`
        : 'ℹ️ No groups added yet. Run *.addannouncegroup* inside a group to add it.';
    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = { addAnnounceGroupCommand, removeAnnounceGroupCommand, listAnnounceGroupsCommand };
