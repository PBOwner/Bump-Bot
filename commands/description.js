const { rawEmb } = require('../index');

module.exports = {
    name: 'description',
    description: 'Change your server description',
    syntax: '-description <text>',

    async execute(message, args) {
        const { colors } = message.client;
        let emb = rawEmb();
        let text = args.join(' ');

        if (text.length > 4000) {
            emb.setDescription("**Sorry, but you can only use 4000 Characters for your description!**");
            return message.channel.send({ embeds: [emb.setColor(colors.error)] });
        }

        let guild = await message.client.database.server_cache.getGuild(message.guild.id);
        guild.description = text;
        await guild.save();

        emb.setFooter({ text: "Use /preview to see your text" });

        // Use the text as-is for the embed description to support multi-line automatically
        return message.channel.send({ embeds: [emb.setDescription("**Changed description successfully to:** \n" + text).setColor(colors.success)] });
    }
};
