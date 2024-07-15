const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('description')
        .setDescription('Change your server description')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The description text to set')
                .setRequired(true)),

    async execute(interaction) {
        const { colors } = interaction.client;
        let emb = rawEmb();
        let text = interaction.options.getString('text');

        if (text.length > 4000) {
            emb.setDescription("**Sorry, but you can only use 4000 Characters for your description!**");
            return interaction.reply({ embeds: [emb.setColor(colors.error)], ephemeral: true });
        }

        let guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.description = text;
        await guild.save();

        emb.setFooter({ text: "Use #preview to see your text" });

        // Replace newline characters with actual new lines in the embed description
        const formattedText = text.replace(/\\n/g, '\n');

        return interaction.reply({ embeds: [emb.setDescription("**Changed description successfully to:** \n" + formattedText).setColor(colors.success)] });
    }
};
