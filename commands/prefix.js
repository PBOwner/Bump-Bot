const { Message } = require('discord.js');
const { rawEmb } = require('../index');

module.exports = {
    name: 'prefix',
    syntax: 'prefix <prefix>',
    args: true,
    description: 'Change your server prefix',
    perm: 'ADMINISTRATOR',
    commands: ['prefix', 'setprefix'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg, args) {
        const { colors, emotes } = msg.client;
        let emb = rawEmb();

        let guild = await msg.client.database.server_cache.getGuild(msg.guild.id);
        guild.prefix = args[0];
        await guild.save();

        return msg.channel.send({ embeds: [emb.setDescription(`**Changed server prefix successfully to:** \` ${args[0]}\``).setColor(colors.success)] });
    }
};
