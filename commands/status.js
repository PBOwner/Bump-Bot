const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Change the bot\'s presence and activity (Owner only)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of activity')
                .setRequired(false)
                .addChoices(
                    { name: 'Playing', value: 'PLAYING' },
                    { name: 'Streaming', value: 'STREAMING' },
                    { name: 'Listening', value: 'LISTENING' },
                    { name: 'Watching', value: 'WATCHING' },
                    { name: 'Competing', value: 'COMPETING' },
                    { name: 'Custom', value: 'CUSTOM' }
                ))
        .addStringOption(option =>
            option.setName('activity')
                .setDescription('The activity description')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The online status')
                .setRequired(false)
                .addChoices(
                    { name: 'Online', value: 'online' },
                    { name: 'Idle', value: 'idle' },
                    { name: 'Do Not Disturb', value: 'dnd' },
                    { name: 'Invisible', value: 'invisible' }
                )),
    async execute(interaction) {
        const { ownerID } = require('../config.js');
        if (interaction.user.id !== ownerID) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const type = interaction.options.getString('type') || 'CUSTOM';
        let activity = interaction.options.getString('activity');
        const status = interaction.options.getString('status');

        // Replace ${server.count} with the actual server count
        if (activity) {
            activity = activity.replace('${server.count}', interaction.client.guilds.cache.size);
        }

        const presenceData = {};
        if (activity) {
            presenceData.activities = [{ name: activity, type: type }];
        }
        if (status) {
            presenceData.status = status;
        }

        interaction.client.user.setPresence(presenceData);

        const embed = new EmbedBuilder()
            .setTitle('Bot Status Updated')
            .setColor('#00FF00')
            .addFields(
                { name: 'Type', value: type, inline: true },
                { name: 'Activity', value: activity || 'Not set', inline: true },
                { name: 'Status', value: status || 'Not set', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
