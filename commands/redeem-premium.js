const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { premiumCodes } = require('../premiumCodes'); // Import premiumCodes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem-premium')
        .setDescription('Redeem a premium code for your server')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The premium code to redeem')
                .setRequired(true)),

    async execute(interaction) {
        const code = interaction.options.getString('code');

        if (!premiumCodes.has(code)) {
            return interaction.reply({ content: 'Invalid or expired premium code.', ephemeral: true });
        }

        const premiumData = premiumCodes.get(code);
        if (premiumData.redeemed) {
            return interaction.reply({ content: 'This premium code has already been redeemed.', ephemeral: true });
        }

        const guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        guild.premium = true;
        guild.premiumRedeemedAt = Date.now();
        guild.ownerId = interaction.guild.ownerId;
        guild.name = interaction.guild.name;
        guild.ownerName = interaction.guild.ownerId ? (await interaction.client.users.fetch(interaction.guild.ownerId)).tag : 'Unknown';

        // Log the guild object before saving
        console.log('Updating guild with premium status:', guild);

        await guild.save();

        // Verify if the guild was saved correctly
        const savedGuild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);
        console.log('Saved guild:', savedGuild);

        // Update the cache
        interaction.client.database.server_cache.set(guild.key, savedGuild);

        premiumCodes.set(code, { ...premiumData, redeemed: true, guildId: interaction.guild.id });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Premium Redeemed')
            .setDescription('Your server now has premium features enabled.');

        await interaction.reply({ embeds: [embed], ephemeral: true });

        // Start auto-bumping if premium is enabled
        if (savedGuild.premium) {
            startAutoBump(interaction.client, savedGuild);
        }
    }
};

function startAutoBump(client, guild) {
    if (client.autoBumpIntervals && client.autoBumpIntervals[guild.id]) {
        clearInterval(client.autoBumpIntervals[guild.id]);
    }

    client.autoBumpIntervals = client.autoBumpIntervals || {};
    client.autoBumpIntervals[guild.id] = setInterval(async () => {
        const gChannel = await client.channels.cache.get(guild.channel);
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

        const count = await bump(guild.id, guild.name, client, guild.ownerId, client.emotes, client.colors); // Pass the user object
        console.log(guild.name + "   >>>  auto-bumped!");
        var channel = await client.guilds.cache.get(client.supportGuildId).channels.cache.get(client.supportGuildLogChannelId);
        let embed = new EmbedBuilder();
        embed.setDescription(`Auto-bumped ${guild.name}`)
            .setColor(client.colors.success);
        channel.send({ embeds: [embed] });
    }, 7.2e+6); // 2 hours in milliseconds
}
