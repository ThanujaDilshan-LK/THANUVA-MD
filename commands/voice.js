/**
 * THANUVA-MD — .voice <text>
 * Converts text to a spoken voice note using Google Translate's free
 * TTS endpoint (no API key needed). Good for short messages — long
 * text is automatically split into ~200 char chunks and stitched
 * together, since that's the endpoint's per-request limit.
 */

const axios = require('axios');

const MAX_CHUNK = 190;

function splitText(text) {
    const words = text.split(' ');
    const chunks = [];
    let current = '';
    for (const w of words) {
        if ((current + ' ' + w).trim().length > MAX_CHUNK) {
            chunks.push(current.trim());
            current = w;
        } else {
            current = (current + ' ' + w).trim();
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

async function fetchTtsChunk(text, lang) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return Buffer.from(res.data);
}

async function voiceCommand(sock, chatId, message, args) {
    const text = args.join(' ').trim();
    if (!text) {
        return sock.sendMessage(chatId, {
            text: '⚠️ Usage: *.voice <text>* (optionally *.voice si <text>* for Sinhala)'
        }, { quoted: message });
    }

    // Optional language code as the first word, e.g. ".voice si මොකද කතාව"
    let lang = 'en';
    let content = text;
    const maybeLang = text.split(' ')[0];
    if (/^[a-z]{2}$/i.test(maybeLang) && text.split(' ').length > 1) {
        lang = maybeLang.toLowerCase();
        content = text.slice(maybeLang.length).trim();
    }

    if (content.length > 1000) {
        return sock.sendMessage(chatId, { text: '⚠️ Text too long (max 1000 characters).' }, { quoted: message });
    }

    try {
        const chunks = splitText(content);
        const buffers = await Promise.all(chunks.map(c => fetchTtsChunk(c, lang)));
        const audio = Buffer.concat(buffers);

        await sock.sendMessage(chatId, {
            audio,
            mimetype: 'audio/mp4',
            ptt: true, // send as a voice note, not a regular audio file
        }, { quoted: message });
    } catch (error) {
        console.error('voice command error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Could not generate voice note. Try shorter text or check the language code.'
        }, { quoted: message });
    }
}

module.exports = voiceCommand;
