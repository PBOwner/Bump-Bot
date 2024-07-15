const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unblock-server')
        .setDescription('Unblock a server by its ID (Owner only)')
        .addStringOption(option =>
            option.setName('guild-id')
                .setDescription('The ID of the server to unblock')
                .setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        const guildId = interaction.options.getString('guild-id');
        const guild = await interaction.client.database.server_cache.getGuild(guildId);

        if (!guild.blocked) {
            return interaction.reply({ content: 'This server is not blocked.', ephemeral: true });
        }

        guild.blocked = false;
        await guild.save();

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Server Unblocked')
            .setDescription(`The server with ID \`${guildId}\` has been unblocked.`);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
