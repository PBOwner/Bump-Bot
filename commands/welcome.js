const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');
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
        let emb = rawEmb();
        let channel = interaction.options.getChannel('channel');

        if (!channel) {
            emb.setDescription("**You have to mention a channel**");
            return interaction.reply({ embeds: [emb.setColor(colors.error)], ephemeral: true });
        }

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.wlc = channel.id;
        await guild.save();

        return interaction.reply({ embeds: [emb.setDescription("**Changed welcome Channel successfully to:** \n <#" + channel.id + ">").setColor(colors.success)] });
    }
};
