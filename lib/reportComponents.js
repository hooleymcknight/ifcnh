const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    FileUploadBuilder,
    LabelBuilder,
    ModalBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

const REPORT_MODAL_ID = 'ifcnhReportModal';
const REPORT_BUTTON_ID = 'report:open';

/**
 * Builds the report modal.
 *
 * Shared by the /report command and the report button so the two entry points
 * can never drift apart. Nothing here is registered with Discord — modals are
 * constructed fresh each time they're shown.
 *
 * @returns {ModalBuilder} Ready to hand to interaction.showModal().
 */
const buildReportModal = () => {
    const modal = new ModalBuilder().setCustomId(REPORT_MODAL_ID).setTitle('Make a Report');

    const sorryNote = new TextDisplayBuilder().setContent("We're sorry that something went wrong.");

    const whoToReportLabel = new LabelBuilder()
        .setLabel('Who did the thing?')
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId('userToReportInput')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('@userToReport')
                .setMaxLength(100)
                .setMinLength(4)
                .setRequired(false)
        );

    const whatHappenedLabel = new LabelBuilder()
        .setLabel('What happened?')
        .setDescription('Please also mention additional users here if applicable.')
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId('contentInput')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Tell us what went wrong.')
                .setMaxLength(1500)
                .setRequired(true)
        );

    const shareMyUsernameLabel = new LabelBuilder()
        .setLabel('Share my username with the mod team')
        .setCheckboxComponent((checkbox) => checkbox.setCustomId('nonAnon'));

    const screenshotsLabel = new LabelBuilder()
        .setLabel('Upload a screenshot:')
        .setFileUploadComponent(
            new FileUploadBuilder().setCustomId('screenshot').setRequired(false).setMaxValues(5)
        );

    modal.addTextDisplayComponents(sorryNote);
    modal.addLabelComponents(whoToReportLabel, whatHappenedLabel, shareMyUsernameLabel, screenshotsLabel);

    return modal;
};

/**
 * Builds the row of report buttons for the rules and welcome messages.
 *
 * The first button opens the same modal as /report and needs the bot running.
 * The second is a link button to the fallback form — inert markup, so it keeps
 * working even if the bot is down. It's omitted when REPORT_FORM_URL is unset.
 *
 * @returns {ActionRowBuilder} A single action row.
 */
const reportRow = () => {
    const buttons = [
        new ButtonBuilder()
            .setCustomId(REPORT_BUTTON_ID)
            .setLabel('Report')
            .setStyle(ButtonStyle.Secondary),
    ];

    if (process.env.REPORT_FORM_URL) {
        buttons.push(
            new ButtonBuilder()
                .setLabel('Report form')
                .setStyle(ButtonStyle.Link)
                .setURL(process.env.REPORT_FORM_URL)
        );
    }

    return new ActionRowBuilder().addComponents(...buttons);
};

module.exports = { buildReportModal, reportRow, REPORT_MODAL_ID, REPORT_BUTTON_ID };
