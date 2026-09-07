const settings = require('../settings');
const { synthesizeSpeech } = require('./voice');

async function menuCommand(sock, chatId, message) {
    // Send a short bilingual welcome voice note first (English then Sinhala),
    // then the menu text.
    try {
        const botName = global.botname || 'THANUVA-MD';
        const englishPart = await synthesizeSpeech(`Welcome! MR THANUJA presents ${botName}. Here's your menu.`, 'en');
        const sinhalaPart = await synthesizeSpeech(`${botName} වෙත සාදරයෙන් පිළිගනිමු! මිස්ටර් තනූජ ඉදිරිපත් කරන ${botName}. මෙන්න ඔයාගේ මෙනුව.`, 'si');
        const welcomeAudio = Buffer.concat([englishPart, sinhalaPart]);

        await sock.sendMessage(chatId, {
            audio: welcomeAudio,
            mimetype: 'audio/mp4',
            ptt: true,
        }, { quoted: message });
    } catch (error) {
        console.error('menu welcome audio error:', error.message);
        // Non-fatal — if the welcome audio fails, still send the menu text below.
    }

    const text =
`*🤖 THANUVA-MD — Full Menu (223 commands)*
Version: ${settings.version} | Prefix: .

*👥 Group Management (30)*
.ban .kick .promote .demote .mute .unmute .tagall .hidetag .tag .tagnotadmin
.warn .warnings .admins .groupinfo .infogp .infogrupo .listadmin .setgdesc
.setgname .setgpp .setmention .welcome .goodbye .leaves .mode .staff
.revoke .resetlink .move .del .delete .pmblocker

*🛡️ Anti-Abuse / Protection (6)*
.antilink .antibadword .antitag .anticall .antidelete .anularlink

*⬇️ Downloaders (21)*
.play .song .video .ytmp3 .ytmp4 .tiktok .tt .instagram .insta .ig .igs
.igsc .facebook .fb .spotify .mp3 .music .lyrics .tweet .news .weather

*🧠 AI Tools (9)*
.gpt .gemini .dalle .imagine .sora .flux .chatbot .tts .translate

*🖼️ Image Effects & Editing (28)*
.remini .upscale .removebg .rmbg .nobg .enhance .crop .circle .blur .glitch
.matrix .neon .metallic .sand .ice .fire .thunder .snow .purple .light
.glass .waste .script .take .steal .screenshot .ss .ssweb .sc .simage
.tourl .url .vv

*🎨 Country Filters (7)*
.china .japan .korea .india .indonesia .malaysia .thailand

*🎭 Sticker Tools (9)*
.sticker .s .attp .emojimix .emix .stickertelegram .telesticker .tgsticker .namecard

*🎮 Fun & Games (43)*
.tictactoe .ttt .hangman .trivia .guess .answer .8ball .truth .dare .joke
.meme .quote .fact .insult .roseday .shayari .shayri .character .compliment
.flirt .wink .kiss .hug .pat .poke .nom .cry .facepalm .heart .devil .gay
.horny .lgbt .loli .lolice .lovenight .simp .simpcard .ship .stupid
.itssostupid .impressive .triggered .surrender

*🐢 Misc Characters & Memes (8)*
.oogway .oogway2 .animu .animuquote .blackpink .tonikawa .comrade .hacker
.jail .arena

*🛠️ Owner & Bot Config (25)*
.setup .cfgset .settings .apply .myenv .sudo .addcmd .delcmd .resetcmd
.getcmd .channelpost .getchanneljid .addannouncegroup .rmannouncegroup
.announcegroups .changelog .update .clearsession .clearsesi .cleartmp
.setpp .owner .jid .git .github .repo

*⚙️ General / Utility (7)*
.menu .menu2 .help .bot .list .ping .alive .voice

_223 commands total. Owner-only commands will tell you if you're not authorized to use them._`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = menuCommand;
