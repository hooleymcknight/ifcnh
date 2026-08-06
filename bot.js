const { Client, Events, GatewayIntentBits, MessageFlags, Collection } = require('discord.js');

const { updateTextChannelReport } = require('./lib/textChannelReporting.js');
const { updateVoiceChatReport } = require('./lib/voiceChatReporting.js');
const { getCommands } = require('./commands/init.js');
const { forwardReport } = require('./commands/report/forward.js');
const { buildReportModal, REPORT_MODAL_ID, REPORT_BUTTON_ID } = require('./lib/reportComponents.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});

// ============== TESTING ONLY ==============
const testingMode = false; // false before git commit
// ============== TESTING ONLY ==============

client.commands = getCommands(Collection);

client.on(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    /* slash commands */
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
            const payload = {
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(payload);
            } else {
                await interaction.reply(payload);
            }
        }
    }

    /* the Report button on the rules and welcome messages */
    else if (interaction.isButton()) {
        if (interaction.customId === REPORT_BUTTON_ID) {
            await interaction.showModal(buildReportModal());
        }
    }

    /* report submissions */
    else if (interaction.isModalSubmit()) {
        if (interaction.customId === REPORT_MODAL_ID) {
            // ephemeral: nobody else should see that this person filed a report
            await interaction.reply({
                content: 'Thank you for taking the time to submit a report. It has been received.',
                flags: MessageFlags.Ephemeral,
            });

            // user ID only gets processed if user checked yes to that
            const userIdToPass = interaction.fields.getCheckbox('nonAnon') ? interaction.user.id : null;

            try {
                const result = await forwardReport(client, interaction.fields, userIdToPass);
                if (result.degraded) {
                    await interaction.followUp({
                        content:
                            "Heads up — your screenshots didn't make it through, but the rest of the report did. Feel free to DM a mod with the images if they matter.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            } catch (error) {
                console.error('Failed to forward report:', error);
                await interaction.followUp({
                    content:
                        "Something went wrong sending that to the mod team, and I'd rather tell you than lose it quietly. Please DM a mod directly.",
                    flags: MessageFlags.Ephemeral,
                });
            }
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

client.login(process.env.TOKEN);
