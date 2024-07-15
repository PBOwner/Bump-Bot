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
            let command = interaction.client.commands.get(commandName.toLowerCase());
            if (!command) {
                emb.setTitle("Command not found qwq");
                return interaction.reply({ embeds: [emb], ephemeral: true });
            }
            emb.setTitle(command.data.name)
                .addFields(
                    { name: "**Description:**", value: command.data.description || 'No description available.' },
                    { name: "**Usage:**", value: `/${command.data.name}` }
                );

            interaction.reply({ embeds: [emb], ephemeral: true });
        } else {
            let commandList = [];
            for (let [name, cmd] of interaction.client.commands) {
                commandList.push(`**${cmd.data.name}** - ${cmd.data.description || 'No description available.'}`);
            }
            emb.setDescription(commandList.join("\n") + `\n\n[Github](${githubLink})`)
                .setTitle('My Commands');
            interaction.reply({ embeds: [emb.setFooter({ text: `Type /help <command> for more details || ${commandList.length} Commands` })], ephemeral: true });
        }
    }
};
