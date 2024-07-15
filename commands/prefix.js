const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Change your server prefix')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('The prefix to set')
                .setRequired(true)),

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = rawEmb();
        let newPrefix = interaction.options.getString('prefix');

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.prefix = newPrefix;
        await guild.save();

        return interaction.reply({ embeds: [emb.setDescription(`**Changed server prefix successfully to:** \` ${newPrefix}\``).setColor(colors.success)] });
    }
};
