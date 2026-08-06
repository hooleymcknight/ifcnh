const { SlashCommandBuilder } = require('discord.js');
const { buildReportModal } = require('../../lib/reportComponents.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Make an incident report for the if/cnh server.'),
    async execute(interaction) {
        await interaction.showModal(buildReportModal());
    },
};
