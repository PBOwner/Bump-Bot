const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { premiumCodes } = require('../premiumCodes'); // Import premiumCodes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-premium-codes')
        .setDescription('Lists all premium codes tied to the user'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const userCodes = Array.from(premiumCodes.entries()).filter(([code, data]) => data.userId === userId);

            if (userCodes.length === 0) {
                return interaction.reply({ content: 'You have no premium codes.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Your Premium Codes')
                .setDescription(userCodes.map(([code, data]) => `**Code:** \`${code}\`\n**Expiration Date:** ${data.expirationDate ? new Date(data.expirationDate).toLocaleString() : 'Permanent'}\n**Redeemed:** ${data.redeemed ? 'Yes' : 'No'}`).join('\n\n'));

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
            return interaction.reply({ content: 'An error occurred while fetching your premium codes.', ephemeral: true });
        }
    }
};
