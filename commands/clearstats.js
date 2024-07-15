const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config
const { Server } = require('../database/dbInit'); // Import Server model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearstats')
        .setDescription('Clears stats and the database (Owner only)'),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        try {
            // Clear the database
            await Server.destroy({ where: {}, truncate: true });

            // Clear the cache
            interaction.client.database.server_cache.clear();

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription('Stats and database have been cleared successfully.');

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error while clearing the stats and database.', ephemeral: true });
        }
    }
};
