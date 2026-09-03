/**
 * THANUVA-MD — License / Expiry checker
 *
 * One bot instance = one customer. Each customer's deployment (its own
 * folder/session on your VPS) has its own data/license.json with an
 * expiryDate. This module checks that date on startup AND periodically
 * while running, and shuts the bot down gracefully once time is up.
 *
 * This is the IN-PROCESS check. Pair it with the server-side cron
 * script (check-expiries.sh) for a second layer of safety — see README
 * section "Multi-tenant VPS hosting" for the full setup.
 */

const fs = require('fs');
const path = require('path');

const LICENSE_FILE = path.join(__dirname, '..', 'data', 'license.json');
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // re-check every hour while running
const WARNING_DAYS = 3; // send a renewal reminder this many days before expiry

function readLicense() {
    try {
        return JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf-8'));
    } catch (e) {
        // No license file = no expiry enforced (e.g. your own personal bot,
        // not a sold customer deployment). Fail open, not closed.
        return null;
    }
}

function daysRemaining(expiryDate) {
    const ms = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isExpired(license) {
    if (!license?.expiryDate) return false;
    return Date.now() > new Date(license.expiryDate).getTime();
}

/**
 * Call once after the bot connects (connection === 'open'), and again
 * periodically. If expired, notifies the owner + customer number then
 * exits the process. Exit code 42 is used deliberately — see the PM2
 * notes in the README so a process manager doesn't just restart it
 * straight back into an expired state in a loop.
 */
async function enforceLicense(sock, ownerJid) {
    const license = readLicense();
    if (!license) return; // not a sold deployment — nothing to enforce

    if (isExpired(license)) {
        const msg =
`⛔ *THANUVA-MD — Plan Expired*

Your ${license.planName || 'hosting'} plan expired on *${license.expiryDate}*.
The bot is stopping now. Contact us to renew and get back online.`;

        try {
            if (ownerJid) await sock.sendMessage(ownerJid, { text: msg });
        } catch (e) { /* best effort — still shut down even if the message fails */ }

        console.log(`[license] Expired on ${license.expiryDate}. Shutting down.`);
        try { await sock.logout(); } catch (e) {}
        process.exit(42);
        return;
    }

    const remaining = daysRemaining(license.expiryDate);
    if (remaining <= WARNING_DAYS && !license._warned) {
        try {
            if (ownerJid) {
                await sock.sendMessage(ownerJid, {
                    text: `⚠️ *THANUVA-MD* — your plan expires in *${remaining} day(s)* (${license.expiryDate}). Renew soon to avoid downtime.`
                });
            }
            license._warned = true;
            fs.writeFileSync(LICENSE_FILE, JSON.stringify(license, null, 2));
        } catch (e) { /* non-fatal */ }
    }
}

/**
 * Starts the periodic re-check. Call this once after connection === 'open'.
 */
function startLicenseWatcher(sock, ownerJid) {
    enforceLicense(sock, ownerJid); // check immediately on connect
    setInterval(() => enforceLicense(sock, ownerJid), CHECK_INTERVAL_MS);
}

module.exports = { enforceLicense, startLicenseWatcher, isExpired, daysRemaining, readLicense };
