const fs = require('node:fs/promises');

/**
 * Reads a message-ID map, returning an empty map if the file doesn't exist yet.
 *
 * @param {string} p - Absolute path to the JSON file.
 * @returns {Promise<Object<string, string[]>>} Section key to message IDs.
 */
const loadIds = async (p) => {
    try {
        return JSON.parse(await fs.readFile(p, 'utf8'));
    } catch {
        return {};
    }
};

/**
 * Posts chunks, or edits them in place if they've been posted before.
 *
 * Editing rather than reposting is what keeps jump links valid across syncs.
 * A message that was deleted upstream falls through to a fresh send, so a
 * manual cleanup in Discord self-heals on the next run.
 *
 * Components are always passed explicitly, including as an empty array —
 * editing a message won't clear stale buttons otherwise.
 *
 * @param {import('discord.js').TextChannel} channel - Target channel.
 * @param {string} key - Stable key for this block of messages.
 * @param {string[]} chunks - Message contents, in order.
 * @param {Object<string, string[]>} ids - The ID map, read and not mutated.
 * @param {import('discord.js').ActionRowBuilder[]} [components] - Attached to
 *   the final chunk only.
 * @returns {Promise<string[]>} Message IDs, in order.
 */
const upsert = async (channel, key, chunks, ids, components = []) => {
    const existing = ids[key] || [];
    const result = [];

    for (let i = 0; i < chunks.length; i++) {
        const payload = {
            content: chunks[i],
            components: i === chunks.length - 1 ? components : [],
        };
        const id = existing[i];

        if (id) {
            try {
                const msg = await channel.messages.fetch(id);
                await msg.edit(payload);
                result.push(id);
                continue;
            } catch {
                // deleted upstream, fall through to send
            }
        }
        const sent = await channel.send(payload);
        result.push(sent.id);
    }
    return result;
};

module.exports = { loadIds, upsert };
