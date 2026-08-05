import { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import usage from './channelUsageReport.json' with { type: 'json' };
import { updateTextChannelReport } from './lib/textChannelReporting.js';
import { updateVoiceChatReport } from './lib/voiceChatReporting.js';

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
]});

const INVITE = 'https://discord.gg/zHtbuhzp7Q';
const WELCOME_CHANNEL_ID = '1531697295140192488';
// const TESTING_CHANNEL_ID = '1533547535090712596';

const body = [
  'Welcome in! 🌙',
  '',
  'Low expectations, by design.',
  '',
  "There's no feed here. Nothing to keep up with, no guilt for going quiet. Just games.",
  '',
  'Come play when you want company. Bring whoever you like — everyone follows the same rules.',
  '',
  "Ghost when you need, or even leave entirely and come back, as many times as you want. Nobody's watching the door.",
  '',
  'Aim well, roll high, meet quota, farm good.',
  '',
  '-# Permanent invite, in case you leave and want back in:',
  '```' + INVITE + '```'
].join('\n');

/* the shit that comes out of the box for now */

client.on(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);

    const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);
    const message = await channel.send({ content: body, components: [] });
});

client.on(Events.MessageCreate, async (message) => {
    await updateTextChannelReport(message);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    await updateVoiceChatReport(oldState, newState);
});

/* end of box */

client.login(process.env.TOKEN);