const { EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: {
        name: 'status',
        description: 'Manage the bot\'s status and presence',
        options: [
            {
                name: 'action',
                type: 3, // STRING
                description: 'Action to perform (add, remove, start, stop)',
                required: true,
                choices: [
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' },
                    { name: 'Start', value: 'start' },
                    { name: 'Stop', value: 'stop' }
                ]
            },
            {
                name: 'type',
                type: 3, // STRING
                description: 'The type of status (Playing, Streaming, Listening, Watching)',
                required: false,
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
                required: false
            },
            {
                name: 'status',
                type: 3, // STRING
                description: 'The presence (online, idle, dnd, invisible)',
                required: false,
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
        let action = interaction.options.getString('action');
        let type = interaction.options.getString('type');
        let text = interaction.options.getString('text');
        let status = interaction.options.getString('status');

        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({
                embeds: [emb.setDescription("You are not authorized to use this command").setColor(colors.error)],
                ephemeral: true
            });
        }

        const statuses = interaction.client.statuses || [];
        interaction.client.statuses = statuses;

        if (action === 'add') {
            if (!type || !text || !status) {
                return interaction.reply({
                    embeds: [emb.setDescription("Type, text, and status are required to add a new status").setColor(colors.error)],
                    ephemeral: true
                });
            }
            statuses.push({ type, text, status });
            return interaction.reply({
                embeds: [emb.setDescription(`Added new status:\nType: ${type}\nText: ${text}\nStatus: ${status}`).setColor(colors.success)],
                ephemeral: true
            });
        } else if (action === 'remove') {
            if (!type || !text || !status) {
                return interaction.reply({
                    embeds: [emb.setDescription("Type, text, and status are required to remove a status").setColor(colors.error)],
                    ephemeral: true
                });
            }
            const index = statuses.findIndex(s => s.type === type && s.text === text && s.status === status);
            if (index === -1) {
                return interaction.reply({
                    embeds: [emb.setDescription("Status not found").setColor(colors.error)],
                    ephemeral: true
                });
            }
            statuses.splice(index, 1);
            return interaction.reply({
                embeds: [emb.setDescription(`Removed status:\nType: ${type}\nText: ${text}\nStatus: ${status}`).setColor(colors.success)],
                ephemeral: true
            });
        } else if (action === 'start') {
            if (interaction.client.statusInterval) {
                return interaction.reply({
                    embeds: [emb.setDescription("Status cycling is already running").setColor(colors.error)],
                    ephemeral: true
                });
            }
            let index = 0;
            interaction.client.statusInterval = setInterval(() => {
                if (statuses.length === 0) return;
                const { type, text, status } = statuses[index];
                interaction.client.user.setPresence({ status });
                interaction.client.user.setActivity(text, { type });
                index = (index + 1) % statuses.length;
            }, 10000); // Change status every 10 seconds
            return interaction.reply({
                embeds: [emb.setDescription("Started status cycling").setColor(colors.success)],
                ephemeral: true
            });
        } else if (action === 'stop') {
            if (!interaction.client.statusInterval) {
                return interaction.reply({
                    embeds: [emb.setDescription("Status cycling is not running").setColor(colors.error)],
                    ephemeral: true
                });
            }
            clearInterval(interaction.client.statusInterval);
            interaction.client.statusInterval = null;
            return interaction.reply({
                embeds: [emb.setDescription("Stopped status cycling").setColor(colors.success)],
                ephemeral: true
            });
        }
    }
};
