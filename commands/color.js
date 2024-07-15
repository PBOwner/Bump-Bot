const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setDescription('Change your bump embed color')
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The hex color code to set')
                .setRequired(true)),

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = rawEmb();
        let color = interaction.options.getString('color');

        if (!color.startsWith('#')) {
            emb.setDescription("**You need to enter a hex color code qwq**");
            return interaction.reply({ embeds: [emb.setColor(colors.error)], ephemeral: true });
        }

        color = color.slice(1);

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.color = color;
        await guild.save();

        return interaction.reply({ embeds: [emb.setDescription("**Changed color successfully**").setColor(colors.success)] });
    }
};
