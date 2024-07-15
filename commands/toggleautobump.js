const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index'); // Adjust the path to import rawEmb if needed
const config = require('../config'); // Import config
const { bump } = require('./bump'); // Import the bump function from bump.js

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleautobump')
        .setDescription('Toggles automatic bumping every 2 hours (Owner only)'),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        const guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);

        guild.autoBump = !guild.autoBump;
        await guild.save();

        if (guild.autoBump) {
            interaction.client.autoBumpInterval = setInterval(async () => {
                const gChannel = await interaction.guild.channels.cache.get(guild.channel);
                if (!guild.channel || !gChannel) return;

                let invite;
                try {
                    invite = await gChannel.createInvite({
                        maxAge: 86400
                    }, `Auto Bump Invite`);
                } catch {
                    console.log("**Can't create my invite link qwq**");
                    return;
                }

                const count = await bump(interaction.guild.id, interaction.guild.name, interaction, interaction.user, interaction.client.emotes, interaction.client.colors); // Pass the user object
                console.log(interaction.guild.name + "   >>>  auto-bumped!");
                var channel = await interaction.client.guilds.cache.get(interaction.client.supportGuildId).channels.cache.get(interaction.client.supportGuildLogChannelId);
                let emb = rawEmb();
                emb.setDescription(`Auto-bumped ${interaction.guild.name}`)
                    .setColor(interaction.client.colors.success);
                channel.send({ embeds: [emb] });
            }, 7.2e+6); // 2 hours in milliseconds
        } else {
            clearInterval(interaction.client.autoBumpInterval);
        }

        return interaction.reply({ content: `Auto-bumping is now ${guild.autoBump ? 'enabled' : 'disabled'}.`, ephemeral: true });
    }
};
