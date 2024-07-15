const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Change your server advertisement channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set as the advertisement channel')
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
        guild.channel = channel.id;
        await guild.save();

        return interaction.reply({ embeds: [emb.setDescription("**Changed advertisement Channel successfully to:** \n <#" + channel.id + ">").setColor(colors.success)] });
    }
};
