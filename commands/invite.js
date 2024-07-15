const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { rawEmb } = require('../index');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get my Invite link :3'),

    async execute(interaction) {
        const { colors } = interaction.client;
        const supportGuildId = config.supportGuildId;

        let link = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot`;

        let invite;
        try {
            // Fetch the support server
            const supportGuild = await interaction.client.guilds.fetch(supportGuildId);
            // Create an invite for the support server
            const inviteChannel = supportGuild.channels.cache.find(channel => channel.isText() && channel.permissionsFor(supportGuild.me).has('CREATE_INSTANT_INVITE'));
            if (!inviteChannel) {
                throw new Error('No suitable channel found to create an invite link.');
            }
            invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 });
        } catch (error) {
            console.error('Error creating support server invite:', error);
            invite = "https://discord.gg/KJjZnxZ"; // Fallback invite link
        }

        let emb = rawEmb()
            .setTitle("Invite Links");

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Bot Invite')
                    .setStyle('LINK')
                    .setURL(link),
                new MessageButton()
                    .setLabel('Support Server')
                    .setStyle('LINK')
                    .setURL(invite.url)
            );

        interaction.reply({ embeds: [emb], components: [row] });
    }
};
