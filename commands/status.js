const { SlashCommandBuilder } = require('discord.js');

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
                    { name: 'Competing', value: 'COMPETING' }
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
