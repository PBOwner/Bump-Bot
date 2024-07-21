const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { premiumCodes } = require('../premiumCodes'); // Import premiumCodes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem-premium')
        .setDescription('Redeem a premium code for your server')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The premium code to redeem')
                .setRequired(true)),

    async execute(interaction) {
        const code = interaction.options.getString('code');

        if (!premiumCodes.has(code)) {
            return interaction.reply({ content: 'Invalid or expired premium code.', ephemeral: true });
        }

        const premiumData = premiumCodes.get(code);
        if (premiumData.redeemed) {
            return interaction.reply({ content: 'This premium code has already been redeemed.', ephemeral: true });
        }

        const guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.premium = true;
        await guild.save();

        premiumCodes.set(code, { ...premiumData, redeemed: true, guildId: interaction.guild.id });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Premium Redeemed')
            .setDescription('Your server now has premium features enabled.');

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
