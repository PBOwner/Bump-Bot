const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get my Invite link :3'),

    async execute(interaction) {
        const { colors } = interaction.client;

        let link = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot`,
            invite = "https://discord.gg/KJjZnxZ";

        let emb = rawEmb()
            .setTitle("Invite Links")
            .addFields(
                { name: "**Bot-Invite**", value: `[Click](${link})` },
                { name: "**Support Server**", value: `[Click](${invite})` }
            );
        interaction.reply({ embeds: [emb] });
    }
};
