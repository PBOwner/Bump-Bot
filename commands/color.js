const { Message } = require('discord.js');
const { rawEmb } = require('../index');

module.exports = {
    name: 'color',
    syntax: 'color #000000',
    args: true,
    description: 'Change your bump embed color',
    perm: 'ADMINISTRATOR',
    commands: ['color', 'setcolor'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg, args) {
        const { colors, emotes } = msg.client;
        let emb = rawEmb();

        if (args[0].startsWith('#')) {
            var color = args[0].slice(1);
        } else {
            emb.setDescription("**You need to enter a hex color code qwq**");
            return msg.channel.send({ embeds: [emb.setColor(colors.error)] });
        }

        let guild = await msg.client.database.server_cache.getGuild(msg.guild.id);
        guild.color = color;
        await guild.save();

        return msg.channel.send({ embeds: [emb.setDescription("**Changed color successfully**").setColor(colors.success)] });
    }
};
