const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Change your server welcome channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set as the welcome channel')
                .setRequired(true)),

    async execute(interaction) {
        const { colors } = interaction.client;
        let embed = new EmbedBuilder();
        let channel = interaction.options.getChannel('channel');

        if (!channel) {
            embed.setDescription("**You have to mention a channel**");
            return interaction.reply({ embeds: [embed.setColor(colors.error)], ephemeral: true });
        }

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.wlc = channel.id;
        await guild.save();

        return interaction.reply({ embeds: [embed.setDescription("**Changed welcome Channel successfully to:** \n <#" + channel.id + ">").setColor(colors.success)] });
    }
};
