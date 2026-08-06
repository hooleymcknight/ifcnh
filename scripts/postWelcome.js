const path = require('node:path');
const fs = require('node:fs/promises');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { loadIds, upsert } = require('../lib/discordUpsert.js');
const { reportRow } = require('../lib/reportComponents.js');
const { getWelcomeMessage } = require('../content/welcomeMessage.js');

const IDS_PATH = path.join(__dirname, '..', 'content', 'welcome-ids.json');

const run = async () => {
    if (!process.env.WELCOME_CHANNEL_ID) {
        console.error('No WELCOME_CHANNEL_ID configured — check .env');
        process.exit(1);
    }

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once(Events.ClientReady, async () => {
        try {
            const channel = await client.channels.fetch(process.env.WELCOME_CHANNEL_ID);
            const ids = await loadIds(IDS_PATH);

            ids['__welcome__'] = await upsert(channel, '__welcome__', [getWelcomeMessage()], ids, [
                reportRow(),
            ]);

            await fs.writeFile(IDS_PATH, JSON.stringify(ids, null, 2));
            console.log('welcome message synced');
        } catch (err) {
            console.error('welcome sync failed —', err);
            process.exitCode = 1;
        } finally {
            await client.destroy();
        }
    });

    await client.login(process.env.TOKEN);
};

run();
