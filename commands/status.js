const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Change the bot\'s presence and activity (Owner only)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of activity')
                .setRequired(true)
                .addChoice('Playing', 'PLAYING')
                .addChoice('Streaming', 'STREAMING')
                .addChoice('Listening', 'LISTENING')
                .addChoice('Watching', 'WATCHING')
                .addChoice('Competing', 'COMPETING'))
        .addStringOption(option =>
            option.setName('activity')
                .setDescription('The activity description')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The online status')
                .setRequired(true)
                .addChoice('Online', 'online')
                .addChoice('Idle', 'idle')
                .addChoice('Do Not Disturb', 'dnd')
                .addChoice('Invisible', 'invisible')),
    async execute(interaction) {
        const { ownerID } = require('../config.js');
        if (interaction.user.id !== ownerID) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const type = interaction.options.getString('type');
        const activity = interaction.options.getString('activity');
        const status = interaction.options.getString('status');

        interaction.client.user.setPresence({
            activities: [{ name: activity, type: type }],
            status: status
        });

        await interaction.reply(`Bot status updated to: ${type} ${activity} with status ${status}`);
    },
};
