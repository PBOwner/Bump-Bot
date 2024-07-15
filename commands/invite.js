const { Message } = require('discord.js');
const { rawEmb } = require('../index');

module.exports = {
    name: 'invite',
    syntax: 'invite',
    args: false,
    description: 'Get my Invite link :3',
    commands: ['invite', 'inv', 'link', 'support', 'vote'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg) {
        const { colors, emotes } = msg.client;

        let link = `https://discord.com/api/oauth2/authorize?client_id=${msg.client.user.id}&permissions=8&scope=bot`,
            invite = "https://discord.gg/KJjZnxZ";

        let emb = rawEmb()
            .setTitle("Invite Links")
            .addFields(
                { name: "**Bot-Invite**", value: `[Click](${link})` },
                { name: "**Support Server**", value: `[Click](${invite})` }
            );
        msg.channel.send({ embeds: [emb] });
    }
};
