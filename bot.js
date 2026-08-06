import { 
    Client,
    Events,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    SlashCommandBuilder,
    Collection,
    ModalBuilder
 } from 'discord.js';
import usage from './channelUsageReport.json' with { type: 'json' };
import { updateTextChannelReport } from './lib/textChannelReporting.js';
import { updateVoiceChatReport } from './lib/voiceChatReporting.js';
import { getCommands } from './commands/init.js';
import { forwardReport } from './commands/report/forward.js';

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
]});

// ============== TESTING ONLY ==============
const testingMode = false; // false before git commit
// ============== TESTING ONLY ==============

const MOD_REF_SHEET = './mod-reference-sheet.md';
const INVITE = 'https://discord.gg/zHtbuhzp7Q';
const WELCOME_CHANNEL_ID = '1531697295140192488';
const TESTING_CHANNEL_ID = '1533547535090712596';

const data = new SlashCommandBuilder()
	.setName('echo')
	.setDescription('Replies with your input!')
	.addStringOption((option) => option.setName('input').setDescription('The input to echo back'));

/* the shit that comes out of the box for now */

client.commands = getCommands(Collection);

client.on(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);

    // const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);
    // const message = await channel.send({ content: body, components: [] });
    
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    }
	else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'ifcnhReportModal') {
            await interaction.reply({ content: 'Thank you for taking the time to submit a report. It has been received.'});
            // user ID only gets processed if user checked yes to that
            const userIdToPass = interaction.fields.getCheckbox('nonAnon') ? interaction.user.id : null;
            forwardReport(client, interaction.fields, userIdToPass);
        }
    }
});

/* data reporting: */

client.on(Events.MessageCreate, async (message) => {
    if (testingMode) return;
    await updateTextChannelReport(message);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (testingMode) return;
    await updateVoiceChatReport(oldState, newState);
});

/* end of box */

client.login(process.env.TOKEN);