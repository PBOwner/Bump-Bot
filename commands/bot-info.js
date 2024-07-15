const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index'); // Adjust the path to import rawEmb if needed
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-info')
        .setDescription('Displays information about the bot'),

    async execute(interaction) {
        const owner = await interaction.client.users.fetch(config.ownerID);
        const serverCount = interaction.client.guilds.cache.size;
        const userCount = interaction.client.users.cache.size;

        const emb = rawEmb()
            .setColor(config.colors.info)
            .setTitle('Bot Information')
            .addFields(
                { name: 'Owner', value: `${owner.tag} (${owner.id})`, inline: true },
                { name: 'Servers', value: `${serverCount}`, inline: true },
                { name: 'Users', value: `${userCount}`, inline: true }
            );

        return interaction.reply({ embeds: [emb] });
    }
};
