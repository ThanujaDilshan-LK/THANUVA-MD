/**
 * THANUVA-MD — set/renew a customer's license
 *
 * Run this on the VPS whenever you deploy a new customer bot, or when
 * a customer renews their plan. It calculates expiryDate for you —
 * no manual date math needed.
 *
 * Usage:
 *   node set-license.js <plan> [startDate]
 *
 * <plan> is one of: basic (1 month), standard (3 months), premium (5 months)
 *        or a plain number of months, e.g. "2"
 * [startDate] optional, defaults to today. Format: YYYY-MM-DD
 *
 * Examples:
 *   node set-license.js basic
 *      → new deployment, starting today, expires in 1 month
 *
 *   node set-license.js standard
 *      → new deployment, starting today, expires in 3 months
 *
 *   node set-license.js premium 2026-09-15
 *      → started on 2026-09-15, expires 5 months after that
 *
 * Run it from inside the customer's own bot folder (so it writes to
 * that folder's data/license.json) — e.g.:
 *   cd /opt/bots/customer1 && node set-license.js standard
 */

const fs = require('fs');
const path = require('path');

const PLAN_MONTHS = {
    basic: 1,
    standard: 3,
    premium: 5,
};

const PLAN_NAMES = {
    basic: 'Basic Plan',
    standard: 'Standard Plan',
    premium: 'Premium Plan',
};

const LICENSE_FILE = path.join(__dirname, 'data', 'license.json');

function main() {
    const [, , planArg, startDateArg] = process.argv;

    if (!planArg) {
        console.log('Usage: node set-license.js <basic|standard|premium|<months>> [YYYY-MM-DD]');
        process.exit(1);
    }

    const months = PLAN_MONTHS[planArg.toLowerCase()] ?? Number(planArg);
    if (!months || isNaN(months)) {
        console.log(`❌ Unknown plan "${planArg}". Use basic, standard, premium, or a number of months.`);
        process.exit(1);
    }

    const startDate = startDateArg ? new Date(startDateArg) : new Date();
    if (isNaN(startDate.getTime())) {
        console.log(`❌ Invalid start date "${startDateArg}". Use format YYYY-MM-DD.`);
        process.exit(1);
    }

    const expiry = new Date(startDate);
    expiry.setMonth(expiry.getMonth() + months);
    const expiryDate = expiry.toISOString().split('T')[0];

    const license = {
        planName: PLAN_NAMES[planArg.toLowerCase()] || `${months} Month Plan`,
        startDate: startDate.toISOString().split('T')[0],
        expiryDate,
    };

    fs.mkdirSync(path.dirname(LICENSE_FILE), { recursive: true });
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(license, null, 2));

    console.log(`✅ License set:`);
    console.log(`   Plan:    ${license.planName}`);
    console.log(`   Start:   ${license.startDate}`);
    console.log(`   Expires: ${license.expiryDate}`);
    console.log(`\nWritten to ${LICENSE_FILE}`);
    console.log(`If the bot is already running, restart it: pm2 restart <app-name>`);
}

main();
