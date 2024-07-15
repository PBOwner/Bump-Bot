const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ms = require('parse-ms');
const { rawEmb } = require('../index'); // Adjust the path to import rawEmb if needed
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bumps your Server'),

    async execute(interaction) {
        const { colors, emotes } = interaction.client;

        let emb = rawEmb();
        var guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);

        if (!guild.description) {
            emb.setDescription("This Server has no description! please set one qwq");
            return interaction.reply({ embeds: [emb.setColor(colors.error)], ephemeral: true });
        }

        const gChannel = await interaction.guild.channels.cache.get(guild.channel);
        if (!guild.channel || !gChannel) {
            return interaction.reply({ embeds: [emb.setDescription('Please set a valid channel before you bump your server :3').setColor(colors.error)], ephemeral: true });
        }

        let bumped_time = guild.time;
        let now = Date.now();
        if (!bumped_time) bumped_time = now - 8.64e+7;
        let cooldown = 7.2e+6;
        let time = ms(cooldown - (now - bumped_time));

        if (!guild.channel) {
            guild.channel = interaction.channel.id;
            await guild.save();
        } else {
            let F = interaction.client.channels.resolve(guild.channel);
            if (!F) {
                guild.channel = interaction.channel.id;
                await guild.save();
            }
        }

        let invite;
        try {
            invite = await interaction.channel.createInvite({
                maxAge: 86400
            }, `Bump Invite`);
        } catch {
            return interaction.reply({ embeds: [emb.setDescription("**Can't create my invite link qwq**").setColor(colors.error)], ephemeral: true });
        }

        let segments = [];
        if (time.hours > 0) segments.push(time.hours + ' Hour' + ((time.hours == 1) ? '' : 's'));
        if (time.minutes > 0) segments.push(time.minutes + ' Minute' + ((time.minutes == 1) ? '' : 's'));

        const timeString = segments.join('\n');

        // Check if the user is the owner
        if (interaction.user.id !== config.ownerID && cooldown - (now - bumped_time) > 0) {
            emb.setColor(colors.error)
                .setDescription(`**${timeString}**`)
                .setTitle("You have to wait ;-;");
            return interaction.reply({ embeds: [emb], ephemeral: true });
        } else {
            guild.time = now;
            await guild.save();
            const count = await bump(interaction.guild.id, interaction.guild.name, interaction, interaction.user, interaction.client.emotes, interaction.client.colors); // Pass the user object
            emb.setDescription(`**Bumped successfully to ${count} Server**`)
                .setColor(colors.success);
            interaction.reply({ embeds: [emb] });
            console.log(interaction.guild.name + "   >>>  bumped!");
            var channel = await interaction.client.guilds.cache.get(interaction.client.supportGuildId).channels.cache.get(interaction.client.supportGuildLogChannelId);
            channel.send({ embeds: [emb.setDescription(interaction.user.tag + ' bumped ' + interaction.guild.name)] });

            // Schedule a reminder to ping the user after 2 hours
            setTimeout(() => {
                const reminderEmbed = rawEmb()
                    .setColor(colors.info)
                    .setDescription("It's time to bump again!")
                    .setTitle("Bump Reminder");

                interaction.user.send({ embeds: [reminderEmbed] }).catch(() => {
                    console.log(`Failed to send bump reminder to ${interaction.user.tag}`);
                });
            }, 7.2e+6); // 2 hours in milliseconds
        }
    }
};

async function bump(id, title, interaction, user, emotes, colors) {
    var G = await interaction.client.database.server_cache.getGuild(id);
    let invite = await interaction.channel.createInvite({});
    let emb = rawEmb();

    emb.setTitle(title)
        .setDescription(` \n **Description:**\n ${G.description}
        \n :globe_with_meridians: ${interaction.guild.preferredLocale}
        \n ${emotes.user} ${interaction.guild.memberCount}
        `)
        .setColor(G.color != 0 ? G.color : colors.info)
        .setAuthor({ name: user.username + " bumped: ", iconURL: interaction.guild.iconURL() || user.displayAvatarURL() }) // Use user.username and user.displayAvatarURL()
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Join Server')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.gg/${invite.code}`),
            new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.gg/${config.supportGuildId}`),
            new ButtonBuilder()
                .setCustomId('report')
                .setLabel('Report')
                .setStyle(ButtonStyle.Danger)
        );

    let ch = 0;
    let channels = await interaction.client.database.server_cache.getChannel();
    var i = 0;

    for (const c of channels) {
        if (c == 0) return;
        ch = await interaction.client.channels.resolve(c);
        if (!ch) return;
        i++;
        ch.send({ embeds: [emb], components: [row] }).catch(() => { });
    }
    return i - 1;
}
