const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { premiumCodes, generateCode } = require('../premiumCodes'); // Import premiumCodes and generateCode

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generate-premium')
        .setDescription('Generate a premium code for a user')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user (ID, mention, or username) to generate the premium code for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('The duration in days for the premium code (-1 for permanent)')
                .setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        const userInput = interaction.options.getString('user');
        const time = interaction.options.getInteger('time');

        // Function to resolve user input to a user ID
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

        const userId = await resolveUserId(userInput);

        if (!userId) {
            return interaction.reply({ content: 'Invalid user. Please provide a valid user ID, mention, or username.', ephemeral: true });
        }

        const code = generateCode(userId, time);
        const expirationDate = premiumCodes.get(code).expirationDate;

        // Save the code in the database
        await interaction.client.database.PremiumCode.create({
            code,
            userId,
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            redeemed: false,
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Premium Code Generated')
            .setDescription(`Here is your premium code: \`${code}\``)
            .addFields(
                { name: 'User ID', value: userId },
                { name: 'Expiration Date', value: expirationDate ? new Date(expirationDate).toLocaleString() : 'Permanent' }
            );

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
