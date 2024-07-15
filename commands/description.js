const { Message } = require('discord.js');
const { rawEmb } = require('../index');

module.exports = {
    name: 'description',
    syntax: 'description <text>',
    args: true,
    description: 'Change your server description',
    perm: 'ADMINISTRATOR',
    commands: ['description', 'setdescription'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg, args) {
        const { colors, emotes } = msg.client;
        let emb = rawEmb();
        let text = args.join(" ");

        if (text.length > 4000) {
            emb.setDescription("**Sorry, but you can only use 4000 Characters for your description!**");
            return msg.channel.send({ embeds: [emb.setColor(colors.error)] });
        }

        let guild = await msg.client.database.server_cache.getGuild(msg.guild.id);
        guild.description = text;
        await guild.save();

        emb.setFooter({ text: "Use #preview to see your text" });

        return msg.channel.send({ embeds: [emb.setDescription("**Changed description successfully to:** \n" + text).setColor(colors.success)] });
    }
};
