/**
 * THANUVA-MD — .update command
 * Shows a styled changelog. Edit the CHANGELOG array below whenever you
 * ship real changes — keep entries accurate to what THIS bot actually has,
 * don't copy another bot's feature list.
 */

const settings = require('../settings');

const CHANGELOG = [
    {
        version: '5.0.1',
        fixed: [
            'Rebranded fully to THANUVA-MD (name, links, sticker metadata, AI persona)',
            'Fixed invalid Baileys version string in package.json',
            'Updated Baileys to v7.0.0-rc.14',
        ],
        added: [
            '.channelpost — post a message to the bot\'s WhatsApp channel',
            '.setup / .settings / .apply / .myenv — runtime configuration commands',
            'Startup message now shows the connected number & name',
            'Own Pair Code / QR web site (no longer depends on a third-party site)',
        ],
    },
];

async function changelogCommand(sock, chatId, message) {
    const latest = CHANGELOG[0];

    let text =
`*🏆 UPDATE AVAILABLE 🏆*

♥️ *Your THANUVA-MD Customizations Are Here! 😼 v${latest.version} 🕺*
`;

    if (latest.fixed?.length) {
        text += `\n*\`Fixed [🛠️]\`*\n`;
        text += latest.fixed.map(f => `● \`\`\`${f} ✔️\`\`\``).join('\n') + '\n';
    }

    if (latest.added?.length) {
        text += `\n*\`Added [➕]\`*\n`;
        text += latest.added.map(a => `● \`\`\`${a} ✔️\`\`\``).join('\n') + '\n';
    }

    text += `\n🔔 \`important:\` Current running version: *${settings.version}*.`;
    if (settings.version !== latest.version) {
        text += ` A newer version (*${latest.version}*) is available — pull the latest code and redeploy to update.`;
    } else {
        text += ` You're already on the latest version. ✅`;
    }

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = changelogCommand;
