const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-info')
        .setDescription('Displays information about the bot'),

    async execute(interaction) {
        try {
            const owner = await interaction.client.users.fetch(config.ownerID);
            const guilds = interaction.client.guilds.cache;

            // Set to store unique user IDs
            const uniqueUserIds = new Set();

            // Function to fetch all members of a guild
            const fetchAllMembers = async (guild) => {
                try {
                    const members = await guild.members.fetch(); // Fetch all members
                    return members;
                } catch (error) {
                    console.error(`Failed to fetch members for guild ${guild.id}:`, error);
                    return [];
                }
            };

            // Collect promises for fetching all members from all guilds
            const fetchPromises = guilds.map(guild => fetchAllMembers(guild));

            // Wait for all fetch promises to resolve
            const allMembersArray = await Promise.all(fetchPromises);

            // Iterate through each guild's members and collect unique user IDs
            allMembersArray.forEach(members => {
                members.forEach(member => {
                    uniqueUserIds.add(member.user.id);
                });
            });

            const serverCount = guilds.size;
            const userCount = uniqueUserIds.size;

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Bot Information')
                .addFields(
                    { name: 'Owner', value: `${owner.tag} (${owner.id})`, inline: true },
                    { name: 'Servers', value: `${serverCount}`, inline: true },
                    { name: 'Users', value: `${userCount}`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
            return interaction.reply({ content: 'An error occurred while fetching bot information.', ephemeral: true });
        }
    }
};
