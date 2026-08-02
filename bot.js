import { Client, Events, GatewayIntentBits } from 'discord.js';
import usage from './channelUsageReport.json' with { type: 'json' };
import { updateTextChannelReport } from './lib/textChannelReporting.js';
import { updateVoiceChatReport } from './lib/voiceChatReporting.js';

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
]});

/* the shit that comes out of the box for now */

client.on(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
    await updateTextChannelReport(message);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    // console.log(oldState);
    // console.log(newState);
    await updateVoiceChatReport(oldState, newState);
})

/* end of box */

client.login(process.env.TOKEN);