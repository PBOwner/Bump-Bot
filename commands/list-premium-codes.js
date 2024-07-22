const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-premium-codes')
        .setDescription('Lists all premium codes tied to a specified user')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user (ID, mention, or username) to list premium codes for')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const userInput = interaction.options.getString('user');
            let userId;

            if (userInput) {
                // If user input is provided, resolve the user ID
                const resolveUserId = async (input) => {
                    // Check if input is a mention
                    const mentionMatch = input.match(/^<@!?(\d+)>$/);
                    if (mentionMatch) {
                        return mentionMatch[1];
                    }

                    // Check if input is a user ID
                    if (/^\d+$/.test(input)) {
                        return input;
                    }

                    // Check if input is a username
                    const user = await interaction.client.users.cache.find(u => u.tag === input);
                    if (user) {
                        return user.id;
                    }

                    // If no match, return null
                    return null;
                };

                userId = await resolveUserId(userInput);

                if (!userId) {
                    return interaction.reply({ content: 'Invalid user. Please provide a valid user ID, mention, or username.', ephemeral: true });
                }

                // Restrict checking others to the owner
                if (interaction.user.id !== config.ownerID) {
                    return interaction.reply({ content: 'You are not authorized to view other users\' premium codes.', ephemeral: true });
                }
            } else {
                // If no user input is provided, use the ID of the user who ran the command
                userId = interaction.user.id;
            }

            const userCodes = await interaction.client.database.PremiumCode.findAll({ where: { userId } });

            if (userCodes.length === 0) {
                return interaction.reply({ content: 'This user has no premium codes.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Premium Codes')
                .setDescription(userCodes.map(code => `**Code:** \`${code.code}\`\n**Expiration Date:** ${code.expirationDate ? new Date(code.expirationDate).toLocaleString() : 'Permanent'}\n**Redeemed:** ${code.redeemed ? 'Yes' : 'No'}`).join('\n\n'));

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
            return interaction.reply({ content: 'An error occurred while fetching premium codes.', ephemeral: true });
        }
    }
};
