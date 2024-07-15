const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('description')
        .setDescription('Change your server description')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The new server description')
                .setRequired(true)),

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = rawEmb();
        let text = interaction.options.getString('text');

        // Replace escape characters with actual new lines
        text = text.replace(/\\n/g, '\n');

        if (text.length > 4000) {
            emb.setDescription("**Sorry, but you can only use 4000 Characters for your description!**");
            return interaction.reply({ embeds: [emb.setColor(colors.error)], ephemeral: true });
        }

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.description = text;
        await guild.save();

        emb.setFooter({ text: "Use /preview to see your text" });

        // Use the text exactly as it is entered for the embed description to support multi-line automatically
        return interaction.reply({ embeds: [emb.setDescription(`**Changed description successfully to:** \n${text}`).setColor(colors.success)] });
    }
};
