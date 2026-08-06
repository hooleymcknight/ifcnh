const fs = require('node:fs');
const path = require('node:path');
const { createHmac } = require('node:crypto');

const REPORT_PATH = path.join(__dirname, '..', 'channelUsageReport.json');
const EMPTY = { textChannels: {}, voiceChats: {} };

/**
 * Hashes a Discord user ID so usage data never stores who anyone is.
 *
 * Keyed with USER_HASH_KEY, which is a keep-forever value — rotating it
 * orphans every hash already on disk.
 *
 * @param {string} id - Raw Discord user ID.
 * @returns {string} 16-character hex digest.
 */
const psuedoUser = (id) =>
    createHmac('sha256', process.env.USER_HASH_KEY).update(id).digest('hex').slice(0, 16);

/**
 * Reads the usage report, creating an empty one if the file is missing or
 * unparseable, so the bot never crashes on a fresh install.
 *
 * @returns {{textChannels: Object, voiceChats: Object}} The usage report.
 */
const readUsage = () => {
    if (!fs.existsSync(REPORT_PATH)) return structuredClone(EMPTY);
    try {
        const parsed = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
        return { ...structuredClone(EMPTY), ...parsed };
    } catch (err) {
        console.error('channelUsageReport.json is unreadable, starting fresh:', err.message);
        return structuredClone(EMPTY);
    }
};

/**
 * Writes the usage report, collapsing any in-memory Sets into arrays.
 *
 * @param {Object} usage - The usage report to persist.
 */
const writeUsage = (usage) => {
    fs.writeFileSync(
        REPORT_PATH,
        JSON.stringify(usage, (key, value) => (value instanceof Set ? [...value] : value))
    );
};

module.exports = { psuedoUser, readUsage, writeUsage, REPORT_PATH };
