const settings = require("../settings");

// The bot's WhatsApp Channel JID. Update this once you have the real
// numeric ID (see README: sock.newsletterMetadata('invite', <code>)).
const CHANNEL_JID = '120363161513685998@newsletter';

async function channelPostCommand(sock, chatId, message, args, isOwnerOrSudo) {
    try {
        if (!isOwnerOrSudo) {
            await sock.sendMessage(chatId, {
                text: '❌ Only the bot owner can post to the channel.'
            }, { quoted: message });
            return;
        }

        const text = args.join(' ').trim();
        if (!text) {
            await sock.sendMessage(chatId, {
                text: '⚠️ Usage: *.channelpost* <your message>'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(CHANNEL_JID, { text });

        await sock.sendMessage(chatId, {
            text: '✅ Message posted to the THANUVA-MD channel.'
        }, { quoted: message });
    } catch (error) {
        console.error('Error in channelpost command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Could not post to the channel. Make sure this WhatsApp account is an admin/owner of the channel, and that CHANNEL_JID in channelpost.js is your real channel ID (not the placeholder).'
        }, { quoted: message });
    }
}

module.exports = channelPostCommand;
