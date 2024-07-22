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

            // Log all guilds fetched from the database
            console.log('All guilds:', guilds);

            guilds.forEach(guild => {
                console.log(`Guild ID: ${guild.key}, Premium: ${guild.premium}`);
                if (guild.premium) {
                    premiumServers.push(guild);
                }
            });

            // Log the premium servers
            console.log('Premium servers:', premiumServers);

            if (premiumServers.length === 0) {
                return interaction.reply({ content: 'There are no premium servers.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Premium Servers')
                .setDescription(premiumServers.map(guild => {
                    const owner = interaction.client.users.cache.get(guild.ownerId);
                    return `**${guild.name}** (ID: ${guild.id})\nOwner: ${owner ? owner.tag : 'Unknown'} (ID: ${guild.ownerId})\nRedeemed At: ${guild.premiumRedeemedAt ? new Date(guild.premiumRedeemedAt).toLocaleString() : 'Unknown'}`;
                }).join('\n\n'));

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
            return interaction.reply({ content: 'An error occurred while fetching premium servers.', ephemeral: true });
        }
    }
};
