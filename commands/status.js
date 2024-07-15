const { Message } = require('discord.js');
const { rawEmb } = require('../index');

module.exports = {
    name: 'status',
    syntax: 'status',
    args: true,
    description: 'Change the bot\'s status',
    perm: 'ADMINISTRATOR',
    commands: ['status'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg, args) {
        const { colors, emotes } = msg.client;
        let emb = rawEmb();
        if (msg.author.id !== msg.client.ownerID) {
            return msg.channel.send({ embeds: [emb.setDescription("You are not authorized to use this command").setColor(colors.error)] });
        }

        msg.client.user.setActivity(args.join(' '), { type: 'PLAYING' });

        return msg.channel.send({ embeds: [emb.setDescription("**Changed status to:** \n " + args.join(' ')).setColor(colors.success)] });
    }
};
