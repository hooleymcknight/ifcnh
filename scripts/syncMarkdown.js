const fs = require('node:fs/promises');
const path = require('node:path');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { normalize, splitSections, pack } = require('../lib/markdownToDiscord.js');
const { loadIds, upsert } = require('../lib/discordUpsert.js');
const { reportRow } = require('../lib/reportComponents.js');

const ROOT = path.join(__dirname, '..');

const TARGETS = {
    reference: {
        file: 'content/mod-reference-sheet.md',
        ids: 'content/reference-ids.json',
        channelId: process.env.REFERENCE_CHANNEL_ID,
        index: true,
        indexTitle: '# Mod reference sheet',
        // the file's own `# ` title would duplicate indexTitle once posted,
        // so it's skipped here and kept in the file for reading offline
        skipPreamble: true,
    },
    rules: {
        file: 'content/rules.md',
        ids: 'content/rules-ids.json',
        channelId: process.env.RULES_CHANNEL_ID,
        index: false,
        components: () => [reportRow()],
    },
};

const run = async () => {
    const name = process.argv[2];
    const target = TARGETS[name];

    if (!target) {
        console.error(`Unknown target "${name}". Options: ${Object.keys(TARGETS).join(', ')}`);
        process.exit(1);
    }
    if (!target.channelId) {
        console.error(`No channel ID configured for "${name}" — check .env`);
        process.exit(1);
    }

    const idsPath = path.join(ROOT, target.ids);
    const saveIds = (ids) => fs.writeFile(idsPath, JSON.stringify(ids, null, 2));

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once(Events.ClientReady, async () => {
        try {
            const channel = await client.channels.fetch(target.channelId);
            const ids = await loadIds(idsPath);
            const text = normalize(await fs.readFile(path.join(ROOT, target.file), 'utf8'));
            const sections = splitSections(text).filter(
                (s) => !(target.skipPreamble && s.preamble)
            );
            const components = target.components ? target.components() : [];

            // Reserve the index's slot before the sections so it lands at the top.
            // Discord orders by send time and editing never moves a message, so
            // this placeholder becomes the real index a few seconds later.
            if (target.index) {
                ids['__index__'] = await upsert(channel, '__index__', ['-# Building index…'], ids);
                await saveIds(ids);
            }

            for (const section of sections) {
                const isLast = section === sections[sections.length - 1];
                ids[section.title] = await upsert(
                    channel,
                    section.title,
                    pack(section.lines),
                    ids,
                    isLast ? components : []
                );
                await saveIds(ids);
            }

            if (target.index) {
                const links = sections
                    .filter((s) => !s.preamble)
                    .map(
                        (s) =>
                            `- [${s.title}](https://discord.com/channels/${channel.guildId}/${channel.id}/${ids[s.title][0]})`
                    );

                const index = [
                    target.indexTitle,
                    '-# Jump links. You click. Discord jumps.',
                    '',
                    ...links,
                ]
                    .filter(Boolean)
                    .join('\n');

                ids['__index__'] = await upsert(channel, '__index__', [index], ids);
                await saveIds(ids);
            }

            console.log(`${name}: ${sections.length} section(s) synced`);
        } catch (err) {
            console.error(`${name}: sync failed —`, err);
            process.exitCode = 1;
        } finally {
            await client.destroy();
        }
    });

    await client.login(process.env.TOKEN);
};

run();
