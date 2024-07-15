const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('revoke-premium')
        .setDescription('Revoke premium from a server (Owner only)')
        .addStringOption(option =>
            option.setName('guild-id')
                .setDescription('The ID of the server to revoke premium from')
                .setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        const guildId = interaction.options.getString('guild-id');
        const guild = await interaction.client.database.server_cache.getGuild(guildId);

        if (!guild.premium) {
            return interaction.reply({ content: 'This server does not have premium features enabled.', ephemeral: true });
        }

        guild.premium = false;
        await guild.save();

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Premium Revoked')
            .setDescription(`Premium features have been revoked from the server with ID: ${guildId}`);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
