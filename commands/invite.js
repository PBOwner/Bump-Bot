const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { rawEmb } = require('../index');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get my Invite link :3'),

    async execute(interaction) {
        const { colors } = interaction.client;

        let botInviteLink = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot`;
        let supportInviteLink = config.supportInviteLink; // Use the fixed support server invite link from config

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
