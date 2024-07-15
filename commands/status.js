const { EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: {
        name: 'status',
        description: 'Change the bot\'s status',
        options: [
            {
                name: 'type',
                type: 3, // STRING
                description: 'The type of status',
                required: true,
                choices: [
                    { name: 'Playing', value: 'PLAYING' },
                    { name: 'Streaming', value: 'STREAMING' },
                    { name: 'Listening', value: 'LISTENING' },
                    { name: 'Watching', value: 'WATCHING' }
                ]
            },
            {
                name: 'text',
                type: 3, // STRING
                description: 'The status text',
                required: true
            },
            {
                name: 'status',
                type: 3, // STRING
                description: 'The status (online, idle, dnd, invisible)',
                required: true,
                choices: [
                    { name: 'Online', value: 'online' },
                    { name: 'Idle', value: 'idle' },
                    { name: 'Do Not Disturb', value: 'dnd' },
                    { name: 'Invisible', value: 'invisible' }
                ]
            }
        ],
        toJSON() {
            return {
                name: this.name,
                description: this.description,
                options: this.options
            };
        }
    },

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = new EmbedBuilder();
        let type = interaction.options.getString('type');
        let text = interaction.options.getString('text');
        let status = interaction.options.getString('status');

        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({
                embeds: [emb.setDescription("You are not authorized to use this command").setColor(colors.error)],
                ephemeral: true
            });
        }

        try {
            // Log the current presence before setting the new one
            console.log('Current Presence:', interaction.client.user.presence);

            // Set the new presence
            await interaction.client.user.setPresence({
                activities: [{ name: text, type: type }],
                status: status
            });

            // Log the new presence after setting it
            console.log('New Presence:', interaction.client.user.presence);

            // Get the updated presence
            const currentPresence = interaction.client.user.presence;
            const currentActivity = currentPresence.activities[0];

            // Create a response embed with the updated presence
            emb.setDescription(`**Changed status to:**\nType: ${type}\nText: ${text}\nStatus: ${status}`)
               .setColor(colors.success)
               .addFields(
                   { name: 'Current Type', value: currentActivity ? currentActivity.type : 'None', inline: true },
                   { name: 'Current Text', value: currentActivity ? currentActivity.name : 'None', inline: true },
                   { name: 'Current Status', value: currentPresence.status, inline: true }
               );

            return interaction.reply({ embeds: [emb] });
        } catch (error) {
            console.error('Error setting presence:', error);
            return interaction.reply({
                embeds: [emb.setDescription("Failed to set status").setColor(colors.error)],
                ephemeral: true
            });
        }
    }
};
