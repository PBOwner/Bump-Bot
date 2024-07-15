const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const config = require('../config'); // Import config

const premiumCodes = new Map(); // In-memory storage for premium codes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generate-premium')
        .setDescription('Generate a premium code for a user')
        .addStringOption(option =>
            option.setName('user-id')
                .setDescription('The ID of the user to generate the premium code for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('The duration in days for the premium code (-1 for permanent)')
                .setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getString('user-id');
        const time = interaction.options.getInteger('time');
        const code = uuidv4();
        const expirationDate = time === -1 ? null : Date.now() + time * 24 * 60 * 60 * 1000;

        premiumCodes.set(code, { userId, expirationDate, redeemed: false });

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
