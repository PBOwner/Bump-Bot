const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('preview')
        .setDescription('Shows your server bump embed'),

    async execute(interaction) {
        const { colors, emotes } = interaction.client;
        let guildData = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        let des = guildData.description != 0 ? guildData.description : "None";

        let emb = new EmbedBuilder()
            .setTitle(`Preview [${interaction.guild.name}]`)
            .setColor(guildData.color != 0 ? guildData.color : colors.info)
            .setDescription(`\n **Description:**\n ${des}
            \n **Invite: [click]**
            \n :globe_with_meridians: ${interaction.guild.preferredLocale}
            \n ${emotes.user} ${interaction.guild.memberCount}
            `);
        return interaction.reply({ embeds: [emb] });
    }
};
