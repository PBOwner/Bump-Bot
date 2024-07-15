const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ms = require('parse-ms');
const config = require('../config'); // Import config

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bumps your Server'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const { colors, emotes } = interaction.client;
            let embed = new EmbedBuilder();
            var guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);

            // Check if the server is blocked
            if (guild.blocked) {
                embed.setColor(colors.error)
                    .setDescription("This server is blocked from using the bump command.");
                return interaction.editReply({ embeds: [embed] });
            }

            if (!guild.description) {
                embed.setDescription("This Server has no description! please set one qwq");
                return interaction.editReply({ embeds: [embed.setColor(colors.error)] });
            }

            const gChannel = await interaction.guild.channels.cache.get(guild.channel);
            if (!guild.channel || !gChannel) {
                return interaction.editReply({ embeds: [embed.setDescription('Please set a valid channel before you bump your server :3').setColor(colors.error)] });
            }

            let bumped_time = guild.time;
            let now = Date.now();
            if (!bumped_time) bumped_time = now - 8.64e+7;
            let cooldown = 7.2e+6;
            let time = ms(cooldown - (now - bumped_time));

            if (!guild.channel) {
                guild.channel = interaction.channel.id;
                await guild.save();
            } else {
                let F = interaction.client.channels.resolve(guild.channel);
                if (!F) {
                    guild.channel = interaction.channel.id;
                    await guild.save();
                }
            }

            // Check if the invite link already exists
            let invite = guild.invite;
            if (!invite) {
                try {
                    invite = await interaction.channel.createInvite({
                        maxAge: 0, // Permanent invite
                        unique: true
                    }, `Bump Invite`);
                    guild.invite = invite.code; // Store the invite code in the database
                    await guild.save();
                } catch {
                    return interaction.editReply({ embeds: [embed.setDescription("**Can't create my invite link qwq**").setColor(colors.error)] });
                }
            }

            let segments = [];
            if (time.hours > 0) segments.push(time.hours + ' Hour' + ((time.hours == 1) ? '' : 's'));
            if (time.minutes > 0) segments.push(time.minutes + ' Minute' + ((time.minutes == 1) ? '' : 's'));

            const timeString = segments.join('\n');

            // Check if the user is the owner
            if (interaction.user.id !== config.ownerID && cooldown - (now - bumped_time) > 0) {
                embed.setColor(colors.error)
                    .setDescription(`**${timeString}**`)
                    .setTitle("You have to wait ;-;");
                return interaction.editReply({ embeds: [embed] });
            } else {
                guild.time = now;
                guild.lastBumper = interaction.user.id; // Store the user ID of the last person who bumped
                guild.bumpCount = (guild.bumpCount || 0) + 1; // Increment the bump count
                await guild.save();
                const count = await module.exports.bump(interaction.guild.id, interaction.guild.name, interaction, interaction.user, interaction.client.emotes, interaction.client.colors); // Pass the user object
                embed.setDescription(`**Bumped successfully to ${count} Server${count === 1 ? '' : 's'}**`)
                    .setColor(colors.success)
                    .setFooter({ text: `Total Bumps: ${guild.bumpCount} | Guild ID: ${interaction.guild.id}` }); // Add the total bump count and guild ID to the footer
                await interaction.editReply({ embeds: [embed] });
                console.log(interaction.guild.name + "   >>>  bumped!");
                var channel = await interaction.client.guilds.cache.get(interaction.client.supportGuildId).channels.cache.get(interaction.client.supportGuildLogChannelId);
                channel.send({ embeds: [embed.setDescription(interaction.user.tag + ' bumped ' + interaction.guild.name)] });

                // Schedule a reminder to ping the user after 2 hours
                setTimeout(async () => {
                    const reminderEmbed = new EmbedBuilder()
                        .setColor(colors.info)
                        .setTitle("Bump Reminder")
                        .addFields(
                            { name: "<:dot:1262419415400714331> Bump Reminder!", value: "Time to bump! Use `/bump` or click the button below!" },
                            { name: "<:dot:1262419415400714331> Need help?", value: "Join the support server! Use `/invite` and click Support Server!" }
                        );

                    try {
                        const bumpChannel = interaction.client.channels.cache.get(guild.channel);
                        await bumpChannel.send({ content: `<@${guild.lastBumper}>`, embeds: [reminderEmbed] });
                        await bumpChannel.send({ components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('bump')
                                .setLabel('Bump Again')
                                .setStyle(ButtonStyle.Success)
                        )] });
                    } catch (error) {
                        console.log(`Failed to send bump reminder to channel ${guild.channel}`);
                    }
                }, 7.2e+6); // 2 hours in milliseconds
            }
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    },

    // Export the bump function
    bump: async function bump(id, title, interaction, user, emotes, colors) {
        var G = await interaction.client.database.server_cache.getGuild(id);
        let inviteCode = G.invite;
        let inviteURL = `https://discord.gg/${inviteCode}`;
        let embed = new EmbedBuilder();

        embed.setTitle(interaction.guild.name) // Set the title to the server's name
            .setDescription(` \n **Description:**\n ${G.description}
            \n :globe_with_meridians: ${interaction.guild.preferredLocale}
            \n ${emotes.user} ${interaction.guild.memberCount}
            `)
            .setColor(G.color != 0 ? G.color : colors.info)
            .setAuthor({ name: user.username + " bumped: ", iconURL: interaction.guild.iconURL() || user.displayAvatarURL() }) // Use user.username and user.displayAvatarURL()
            .setFooter({ text: `Guild ID: ${interaction.guild.id}` }) // Add the guild ID to the footer
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Join Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteURL),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.supportInviteLink),
                new ButtonBuilder()
                    .setCustomId('report')
                    .setLabel('Report')
                    .setStyle(ButtonStyle.Danger)
            );

        let channels = await interaction.client.database.server_cache.getChannel();
        let i = 0;

        for (const c of channels) {
            if (c === 0) continue;
            const ch = await interaction.client.channels.resolve(c);
            if (!ch) continue;
            i++;
            ch.send({ embeds: [embed], components: [row] }).then(message => {
                const filter = i => i.customId === 'report';
                const collector = message.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'report') {
                        try {
                            await i.deferUpdate();
                        } catch (error) {
                            console.error('Failed to defer update:', error);
                        }
                        const reportChannel = await interaction.client.channels.fetch(config.reportChannelId);
                        const reportEmbed = new EmbedBuilder()
                            .setTitle('Reported Server')
                            .setDescription(`Server: ${interaction.guild.name}\nReported by: ${i.user.tag}\n\n**Server Description:**\n${G.description}`)
                            .setColor(config.colors.error)
                            .setFooter({ text: `Guild ID: ${interaction.guild.id}` }) // Add the guild ID to the footer
                            .setTimestamp();

                        const reportRow = new ActionRowBuilder()
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

                        await reportChannel.send({ embeds: [reportEmbed], components: [reportRow] });
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        const disabledRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setLabel('Join Server')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(inviteURL)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setLabel('Support Server')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(config.supportInviteLink)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('report')
                                    .setLabel('Report')
                                    .setStyle(ButtonStyle.Danger)
                                    .setDisabled(true)
                            );
                        message.edit({ components: [disabledRow] }).catch(console.error);
                    }
                });
            }).catch(console.error);
        }
        return i; // Return the count of successful sends
    }
}
