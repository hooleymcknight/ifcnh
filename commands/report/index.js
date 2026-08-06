const { TextInputBuilder, TextInputStyle, TextDisplayBuilder, FileUploadBuilder } = require('discord.js');
const { SlashCommandBuilder, ModalBuilder, LabelBuilder } = require('discord.js');

/**
 * just a quick "dang dude sorry" note at the top
 * @returns TextDisplayBuilder() object 
 */
const buildSorryNote = () => {
    return (new TextDisplayBuilder().setContent(
        'We\'re sorry that something went wrong.'
    ));
}

/**
 * for the "who did it" part of the report
 * @returns LabelBuilder() object 
 */
const buildUserInputs = () => {
    const userToReportInput = new TextInputBuilder()
        .setCustomId('userToReportInput')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('@userToReport')
        // .setId(1)
        .setMaxLength(100)
        .setMinLength(4)
        .setRequired(false);

    const whoToReportLabel = new LabelBuilder()
        .setLabel('Who did the thing?')
        // .setDescription('explain.')
        .setTextInputComponent(userToReportInput);

    return whoToReportLabel;
}

/**
 * for the "what happened" part of the report
 * @returns LabelBuilder() object 
 */
const buildContentInputs = () => {
    const contentInput = new TextInputBuilder()
        .setCustomId('contentInput')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell us what went wrong.')
        .setMaxLength(1500)
        .setRequired(true);
    
    const whatHappenedLabel = new LabelBuilder()
        .setLabel('What happened?')
        .setDescription('Please also mention additional users here if applicable.')
        .setTextInputComponent(contentInput);

    return whatHappenedLabel;
}

/**
 * for uploading images
 * @returns LabelBuilder() object 
 */
const buildScreenshotsInputs = () => {
    const uploader = new FileUploadBuilder()
        .setCustomId('screenshot')
        .setRequired(false)
        .setMaxValues(5);

    const uploadLabel = new LabelBuilder()
        .setLabel('Upload a screenshot:')
        // .setDescription('Feel free to share up to 5 screenshots with us')
        .setFileUploadComponent(uploader);
    
    return uploadLabel;
}

module.exports = {
	data: new SlashCommandBuilder().setName('report').setDescription('Make an incident report for the if/cnh server.'),
	async execute(interaction) {
        const modal = new ModalBuilder().setCustomId('ifcnhReportModal').setTitle('Make a Report');

        const wereSorry = buildSorryNote();
        const whoToReportLabel = buildUserInputs();
        const whatToReportLabel = buildContentInputs();
        const screenshotsLabel = buildScreenshotsInputs();

        const shareMyUsernameLabel = new LabelBuilder()
            .setLabel('Share my username with the mod team')
            .setCheckboxComponent((checkbox) => checkbox.setCustomId('nonAnon'));

        modal.addTextDisplayComponents(wereSorry);
        modal.addLabelComponents(whoToReportLabel, whatToReportLabel, shareMyUsernameLabel, screenshotsLabel);

        await interaction.showModal(modal);
	},
};