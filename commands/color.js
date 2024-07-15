const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
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
        let embed = new EmbedBuilder();
        let color = interaction.options.getString('color');

        if (!color.startsWith('#')) {
            embed.setDescription("**You need to enter a hex color code qwq**");
            return interaction.reply({ embeds: [embed.setColor(colors.error)], ephemeral: true });
        }

        color = color.slice(1);

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.color = color;
        await guild.save();

        return interaction.reply({ embeds: [embed.setDescription("**Changed color successfully**").setColor(colors.success)] });
    }
};
