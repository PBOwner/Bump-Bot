const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-premium-servers')
        .setDescription('Lists all premium servers'),

    async execute(interaction) {
        try {
            const premiumServers = [];
            const guilds = await interaction.client.database.server_cache.getAllGuilds();

            guilds.forEach(guild => {
                if (guild.premium) {
                    premiumServers.push(guild);
                }
            });

            if (premiumServers.length === 0) {
                return interaction.reply({ content: 'There are no premium servers.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Premium Servers')
                .setDescription(premiumServers.map(guild => `**${guild.name}** (ID: ${guild.id})`).join('\n'));

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
            return interaction.reply({ content: 'An error occurred while fetching premium servers.', ephemeral: true });
        }
    }
};
