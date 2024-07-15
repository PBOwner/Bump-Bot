const { Message, Guild, MessageEmbed } = require('discord.js');
const ms = require('parse-ms');
const { rawEmb } = require('../index');

module.exports = {
    name: 'bump',
    syntax: 'bump',
    args: false,
    description: 'Bumps your Server',
    commands: ['bump'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg, args) {
        const { colors, emotes } = msg.client;

        let emb = rawEmb();
        var guild = await msg.client.database.server_cache.getGuild(msg.guild.id);

        if (guild.description == 0) {
            emb.setDescription("This Server has no description! please set one qwq");
            return msg.channel.send({ embeds: [emb.setColor(colors.error)] });
        }

        const gChannel = await msg.guild.channels.cache.get(guild.channel);
        if (guild.channel == 0 || !gChannel) {
            return msg.channel.send({ embeds: [emb.setDescription('Please set a valid channel before you bump your server :3').setColor(colors.error)] });
        }

        let bumped_time = guild.time;
        let now = Date.now();
        if (bumped_time == 0) bumped_time = now - 8.64e+7;
        let cooldown = 7.2e+6;
        let time = ms(cooldown - (now - bumped_time));

        if (guild.channel == 0) {
            guild.channel = msg.channel.id;
            await guild.save();
        } else {
            let F = msg.client.channels.resolve(guild.channel);
            if (!F) {
                guild.channel = msg.channel.id;
                await guild.save();
            }
        }

        let invite;
        try {
            invite = await msg.channel.createInvite({
                maxAge: 86400
            }, `Bump Invite`);
        } catch {
            return msg.channel.send({ embeds: [emb.setDescription("**Can't create my invite link qwq**").setColor(colors.error)] });
        }

        let segments = [];
        if (time.hours > 0) segments.push(time.hours + ' Hour' + ((time.hours == 1) ? '' : 's'));
        if (time.minutes > 0) segments.push(time.minutes + ' Minute' + ((time.minutes == 1) ? '' : 's'));

        const timeString = segments.join('\n');

        if (cooldown - (now - bumped_time) > 0) {
            emb.setColor(colors.error)
                .setDescription(`**${timeString}**`)
                .setTitle("You have to wait ;-;");
            return msg.channel.send({ embeds: [emb] });
        } else {
            guild.time = now;
            await guild.save();
            const count = await bump(msg.guild.id, msg.guild.name, msg, msg.author, msg.client.emotes, msg.client.colors); // Pass the user object
            emb.setDescription(`**Bumped successfully to ${count} Server**`)
                .setColor(colors.success);
            msg.channel.send({ embeds: [emb] });
            console.log(msg.guild.name + "   >>>  bumped!");
            var channel = await msg.client.guilds.cache.get(msg.client.supportGuildId).channels.cache.get(msg.client.supportGuildLogChannelId);
            channel.send({ embeds: [emb.setDescription(msg.author.tag + ' bumped ' + msg.guild.name)] });
        }
    }
};

async function bump(id, title, msg, user, emotes, colors) {
    var G = await msg.client.database.server_cache.getGuild(id);
    let invite = await msg.channel.createInvite({});
    let emb = rawEmb();

    emb.setTitle(title)
        .setDescription(` \n **Description:**\n ${G.description}
        \n **Invite: [click](${"https://discord.gg/" + invite.code})**
        \n :globe_with_meridians: ${msg.guild.preferredLocale}
        \n ${emotes.user} ${msg.guild.memberCount}
        `)
        .setColor(G.color != 0 ? G.color : colors.info)
        .setAuthor({ name: user.username + " bumped: ", iconURL: msg.guild.iconURL() || user.displayAvatarURL() }) // Use user.username and user.displayAvatarURL()
        .setTimestamp();

    let ch = 0;
    let channels = await msg.client.database.server_cache.getChannel();
    var i = 0;

    for (const c of channels) {
        if (c == 0) return;
        ch = await msg.client.channels.resolve(c);
        if (!ch) return;
        i++;
        ch.send({ embeds: [emb] }).catch(() => { });
    }
    return i - 1;
}
