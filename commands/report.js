const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a server for inappropriate behavior'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('reportModal')
            .setTitle('Report a Server');

        const guildIdInput = new TextInputBuilder()
            .setCustomId('guildId')
            .setLabel('Guild ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the Guild ID from the bump footer')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter the reason for reporting the server')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(guildIdInput);
        const secondActionRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    }
};
