const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { rawEmb } = require('../index');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get my Invite link :3'),

    async execute(interaction) {
        const { colors } = interaction.client;
        const supportGuildId = config.supportGuildId;

        let botInviteLink = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot`;

        let supportInviteLink;
        try {
            // Fetch the support server
            const supportGuild = await interaction.client.guilds.fetch(supportGuildId);
            // Create an invite for the support server
            const inviteChannel = supportGuild.channels.cache.find(channel =>
                channel.isTextBased() && channel.permissionsFor(supportGuild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
            );
            if (!inviteChannel) {
                throw new Error('No suitable channel found to create an invite link.');
            }
            const invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 });
            supportInviteLink = `https://discord.gg/${invite.code}`;
        } catch (error) {
            console.error('Error creating support server invite:', error);
            supportInviteLink = "https://discord.gg/KJjZnxZ"; // Fallback invite link
        }

        let emb = rawEmb()
            .setTitle("Invite Links");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Bot Invite')
                    .setStyle(ButtonStyle.Link)
                    .setURL(botInviteLink),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL(supportInviteLink)
            );

        interaction.reply({ embeds: [emb], components: [row] });
    }
};
