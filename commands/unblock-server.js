// Event: interactionCreate
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'report') {
            const embed = interaction.message.embeds[0];
            if (!embed) {
                return interaction.reply({ content: 'No embed found in the message to report.', ephemeral: true });
            }
            const reportEmbed = new EmbedBuilder(embed)
                .setTitle('Reported Server')
                .setColor(config.colors.error)
                .addFields({ name: 'Reported by', value: interaction.user.tag });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('approve')
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('deny')
                        .setLabel('Deny')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.update({ embeds: [reportEmbed], components: [row] });
        } else if (interaction.customId === 'approve' || interaction.customId === 'deny') {
            if (!interaction.member.roles.cache.has(config.reportApprovalRoleId)) {
                return interaction.reply({ content: 'You do not have permission to approve or deny reports.', ephemeral: true });
            }

            const embed = interaction.message.embeds[0];
            if (!embed || !embed.author || !embed.author.name) {
                return interaction.reply({ content: 'Invalid embed data.', ephemeral: true });
            }
            const guildId = embed.author.name.split(' ')[0]; // Assuming the author field contains the guild ID
            const guild = await interaction.client.database.server_cache.getGuild(guildId);

            if (interaction.customId === 'approve') {
                guild.blocked = true;
                await guild.save();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('unblock')
                            .setLabel('Unblock')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.update({ content: 'Server approved and blocked. You can unblock it if needed.', components: [row] });
            } else if (interaction.customId === 'deny') {
                await interaction.update({ content: 'Report dismissed.', components: [] });
            }
        } else if (interaction.customId === 'unblock') {
            if (!interaction.member.roles.cache.has(config.reportApprovalRoleId)) {
                return interaction.reply({ content: 'You do not have permission to unblock servers.', ephemeral: true });
            }

            const embed = interaction.message.embeds[0];
            if (!embed || !embed.author || !embed.author.name) {
                return interaction.reply({ content: 'Invalid embed data.', ephemeral: true });
            }
            const guildId = embed.author.name.split(' ')[0]; // Assuming the author field contains the guild ID
            const guild = await interaction.client.database.server_cache.getGuild(guildId);
            guild.blocked = false;
            await guild.save();

            await interaction.reply({ content: 'Server unblocked successfully.', ephemeral: true });
        }
    }
});
