const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Change the bot\'s status')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The status to set')
                .setRequired(true)),

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = rawEmb();
        let status = interaction.options.getString('status');

        if (interaction.user.id !== interaction.client.ownerID) {
            return interaction.reply({ embeds: [emb.setDescription("You are not authorized to use this command").setColor(colors.error)], ephemeral: true });
        }

        interaction.client.user.setActivity(status, { type: 'PLAYING' });

        return interaction.reply({ embeds: [emb.setDescription("**Changed status to:** \n " + status).setColor(colors.success)] });
    }
};
