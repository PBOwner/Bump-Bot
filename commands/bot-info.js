const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index'); // Adjust the path to import rawEmb if needed
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-info')
        .setDescription('Displays information about the bot'),

    async execute(interaction) {
        const owner = await interaction.client.users.fetch(config.ownerID);
        const guilds = interaction.client.guilds.cache;

        // Set to store unique user IDs
        const uniqueUserIds = new Set();

        // Iterate through each guild and collect unique user IDs
        guilds.forEach(guild => {
            guild.members.cache.forEach(member => {
                uniqueUserIds.add(member.user.id);
            });
        });

        const serverCount = guilds.size;
        const userCount = uniqueUserIds.size;

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
}
