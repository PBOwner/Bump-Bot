const { Message } = require('discord.js');
const { rawEmb } = require('../index');

module.exports = {
    name: 'help',
    syntax: 'help',
    args: false,
    description: 'Shows you all my Commands',
    commands: ['help'],

    /**
     * @param {Message} msg
     * @param {String[]} args
     */
    async execute(msg, args) {
        const { colors, emotes } = msg.client;
        const githubLink = 'https://github.com/DragonCat4012/Bump-Bot';
        let emb = rawEmb()
            .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() });

        if (args[0]) {
            var command = msg.client.commands.find(cmd => cmd.commands.includes(args[0].toLowerCase()));
            if (!command) {
                emb.setTitle("Command not found qwq");
                return msg.channel.send({ embeds: [emb] });
            }
            emb.setTitle(command.name)
                .addFields(
                    { name: "**Syntax:**", value: command.syntax },
                    { name: "**Description:**", value: command.description }
                )
                .setFooter({ text: "Trigger: " + command.commands.join(', ') });

            msg.channel.send({ embeds: [emb] });
        } else {
            let A = [];
            for (let cmd of msg.client.commands) {
                let command = cmd[1];
                A.push(` **${command.name}** \`%${command.syntax}\`\n ----------------------------------\n`);
            }
            emb.setDescription(A.join(" ") + `\n [Github](${githubLink})`)
                .setTitle('My Commands');
            msg.channel.send({ embeds: [emb.setFooter({ text: `Type %help <command> for more || ${A.length} Commands` })] });
        }
    }
};
