/**
 * THANUVA-MD — TEMPORARY: resolve channel invite code to real JID
 *
 * Run once, get the ID, then delete this file (or leave it, it's owner-only
 * and harmless either way).
 *
 * Usage in WhatsApp: .getchanneljid
 */

async function getChannelJidCommand(sock, chatId, message, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: message });
    }

    const inviteCode = '0029Vb8jflCCBtxFCDITOm1J'; // from your channel's invite link

    try {
        const meta = await sock.newsletterMetadata('invite', inviteCode);
        await sock.sendMessage(chatId, {
            text: `✅ *Channel JID found:*\n\n\`${meta.id}\`\n\nCopy this and give it to Claude to update index.js, main.js, and messageConfig.js.`
        }, { quoted: message });
        console.log('CHANNEL JID:', meta.id);
    } catch (error) {
        console.error('getchanneljid error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Could not resolve channel JID: ${error.message}\n\nMake sure the invite code is correct and the bot account can access the channel.`
        }, { quoted: message });
    }
}

module.exports = getChannelJidCommand;
