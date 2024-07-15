const { SlashCommandBuilder } = require('@discordjs/builders');
const { rawEmb } = require('../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows you all my Commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The specific command to get help for')
                .setRequired(false)),

    async execute(interaction) {
        const { colors } = interaction.client;
        const githubLink = 'https://github.com/DragonCat4012/Bump-Bot';
        let emb = rawEmb()
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        let commandName = interaction.options.getString('command');
        if (commandName) {
            var command = interaction.client.commands.find(cmd => cmd.commands.includes(commandName.toLowerCase()));
            if (!command) {
                emb.setTitle("Command not found qwq");
                return interaction.reply({ embeds: [emb], ephemeral: true });
            }
            emb.setTitle(command.name)
                .addFields(
                    { name: "**Syntax:**", value: command.syntax },
                    { name: "**Description:**", value: command.description }
                )
                .setFooter({ text: "Trigger: " + command.commands.join(', ') });

            interaction.reply({ embeds: [emb], ephemeral: true });
        } else {
            let A = [];
            for (let cmd of interaction.client.commands) {
                let command = cmd[1];
                A.push(` **${command.name}** \`%${command.syntax}\`\n ----------------------------------\n`);
            }
            emb.setDescription(A.join(" ") + `\n [Github](${githubLink})`)
                .setTitle('My Commands');
            interaction.reply({ embeds: [emb.setFooter({ text: `Type %help <command> for more || ${A.length} Commands` })], ephemeral: true });
        }
    }
};
