const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-premium-codes')
        .setDescription('Lists all premium codes tied to the user'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const userCodes = await interaction.client.database.PremiumCode.findAll({ where: { userId } });

            if (userCodes.length === 0) {
                return interaction.reply({ content: 'You have no premium codes.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Your Premium Codes')
                .setDescription(userCodes.map(code => `**Code:** \`${code.code}\`\n**Expiration Date:** ${code.expirationDate ? new Date(code.expirationDate).toLocaleString() : 'Permanent'}\n**Redeemed:** ${code.redeemed ? 'Yes' : 'No'}`).join('\n\n'));

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
            return interaction.reply({ content: 'An error occurred while fetching your premium codes.', ephemeral: true });
        }
    }
};
