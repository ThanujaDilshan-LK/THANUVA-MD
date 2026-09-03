/**
 * THANUVA-MD — Large file delivery helper
 *
 * WhatsApp's own hard limit is 2GB per file (this applies to every
 * WhatsApp client and cannot be bypassed by any bot). For anything at
 * or above that, this sends the file to a free cloud host (GoFile,
 * anonymous upload, no account needed) instead, and sends the
 * customer a download link in chat.
 *
 * Use this from any command that downloads a movie/file locally before
 * delivering it — e.g. call sendLargeFile(...) instead of sending the
 * raw file directly.
 */

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Stay a bit under WhatsApp's real 2GB cap to leave headroom for
// message overhead / slow connections failing mid-upload.
const WHATSAPP_SAFE_LIMIT_BYTES = 1.9 * 1024 * 1024 * 1024; // ~1.9GB

async function uploadToGofile(filePath) {
    // 1. Ask GoFile which upload server to use
    const serverRes = await axios.get('https://api.gofile.io/servers');
    const server = serverRes.data?.data?.servers?.[0]?.name;
    if (!server) throw new Error('Could not get a GoFile upload server.');

    // 2. Upload the file (anonymous — no account/token needed)
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const uploadRes = await axios.post(
        `https://${server}.gofile.io/contents/uploadfile`,
        form,
        { headers: form.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity }
    );

    const link = uploadRes.data?.data?.downloadPage;
    if (!link) throw new Error('GoFile upload succeeded but no link was returned.');
    return link;
}

function formatSize(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sends a local file to the user. Picks the right delivery method
 * automatically based on size.
 *
 * @param sock       Baileys socket
 * @param chatId     destination chat
 * @param message    original message (for the quoted reply)
 * @param filePath   path to the already-downloaded file on disk
 * @param opts       { caption, filename, deleteAfter (default true) }
 */
async function sendLargeFile(sock, chatId, message, filePath, opts = {}) {
    const { caption = '', filename = filePath.split('/').pop(), deleteAfter = true } = opts;

    const stat = fs.statSync(filePath);

    try {
        if (stat.size < WHATSAPP_SAFE_LIMIT_BYTES) {
            // Small enough — send directly as a WhatsApp document
            await sock.sendMessage(chatId, {
                document: fs.readFileSync(filePath),
                fileName: filename,
                mimetype: 'video/mp4',
                caption: caption || `📁 ${filename} (${formatSize(stat.size)})`,
            }, { quoted: message });
            return { method: 'direct' };
        }

        // Too big for WhatsApp — upload to cloud, send a link instead
        await sock.sendMessage(chatId, {
            text: `📦 This file is ${formatSize(stat.size)} — larger than WhatsApp's 2GB limit, so it can't be sent directly. Uploading to a download link instead, this may take a while...`
        }, { quoted: message });

        const link = await uploadToGofile(filePath);

        await sock.sendMessage(chatId, {
            text: `✅ *${filename}* (${formatSize(stat.size)}) is ready:\n${link}\n\n⚠️ Link may expire after a period of inactivity — download soon.`
        }, { quoted: message });
        return { method: 'link', link };

    } finally {
        if (deleteAfter) {
            try { fs.unlinkSync(filePath); } catch (e) { /* already gone, ignore */ }
        }
    }
}

module.exports = { sendLargeFile, formatSize, WHATSAPP_SAFE_LIMIT_BYTES };
