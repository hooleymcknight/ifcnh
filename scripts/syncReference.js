const fs = require('node:fs/promises');
const { Client, GatewayIntentBits } = require('discord.js');
const { normalize, splitSections, pack } = require('../lib/markdownToDiscord.js');
const path = require('node:path');

const contentPath = path.join(__dirname, '../content');
const SHEET = contentPath + '/mod-reference-sheet.md';
const IDS = contentPath + '/reference-ids.json';
const MOD_REF_CHANNEL_ID = '1534692583148617818';
const LIMIT = 1900;

async function loadIds() {
    try {
        return JSON.parse(await fs.readFile(IDS, 'utf8'));
    } catch {
        return {};
    }
}

async function upsert(channel, key, chunks, ids) {
    const existing = ids[key] || [];
    const result = [];

    for (let i = 0; i < chunks.length; i++) {
        const id = existing[i];
        if (id) {
            try {
                const msg = await channel.messages.fetch(id);
                await msg.edit(chunks[i]);
                result.push(id);
                continue;
            } catch {
                // deleted upstream, fall through to send
            }
        }
        const sent = await channel.send(chunks[i]);
        result.push(sent.id);
    }
    return result;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
    const channel = await client.channels.fetch(MOD_REF_CHANNEL_ID);
    const ids = await loadIds();
    const text = normalize(await fs.readFile(SHEET, 'utf8'));
    const sections = splitSections(text);

    for (const section of sections) {
        ids[section.title] = await upsert(channel, section.title, pack(section.lines, LIMIT), ids);
        await fs.writeFile(IDS, JSON.stringify(ids, null, 2));
    }

    const index = [
        '# Mod reference sheet',
        '-# Jump links. You click. Discord jumps.',
        '',
        ...sections.map(
            (s) =>
                `- [${s.title}](https://discord.com/channels/${channel.guildId}/${channel.id}/${ids[s.title][0]})`
        ),
    ].join('\n');

    ids['__index__'] = await upsert(channel, '__index__', [index], ids);
    await fs.writeFile(IDS, JSON.stringify(ids, null, 2));

    console.log(`${sections.length} sections synced`);
    await client.destroy();
});

client.login(process.env.TOKEN);