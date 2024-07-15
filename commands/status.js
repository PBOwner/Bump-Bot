const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Change the bot\'s status')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of status')
                .setRequired(true)
                .addChoices(
                    { name: 'Playing', value: 'PLAYING' },
                    { name: 'Streaming', value: 'STREAMING' },
                    { name: 'Listening', value: 'LISTENING' },
                    { name: 'Watching', value: 'WATCHING' }
                ))
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The status text')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The status (online, idle, dnd, invisible)')
                .setRequired(true)
                .addChoices(
                    { name: 'Online', value: 'online' },
                    { name: 'Idle', value: 'idle' },
                    { name: 'Do Not Disturb', value: 'dnd' },
                    { name: 'Invisible', value: 'invisible' }
                )),

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = rawEmb();
        let type = interaction.options.getString('type');
        let text = interaction.options.getString('text');
        let status = interaction.options.getString('status');

        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ embeds: [emb.setDescription("You are not authorized to use this command").setColor(colors.error)], ephemeral: true });
        }

        interaction.client.user.setPresence({
            activities: [{ name: text, type: type }],
            status: status
        });

        return interaction.reply({ embeds: [emb.setDescription(`**Changed status to:** \n ${type} ${text} (${status})`).setColor(colors.success)] });
    }
};
