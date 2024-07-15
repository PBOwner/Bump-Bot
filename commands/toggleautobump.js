const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config'); // Import config
const { bump } = require('./bump'); // Import the bump function from bump.js

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleautobump')
        .setDescription('Toggles automatic bumping every 2 hours (Owner only)'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.user.id !== config.ownerID) {
                return interaction.editReply({ content: 'You are not authorized to use this command.' });
            }

            const guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);

            guild.autoBump = !guild.autoBump;
            await guild.save();

            if (guild.autoBump) {
                interaction.client.autoBumpInterval = setInterval(async () => {
                    const gChannel = await interaction.guild.channels.cache.get(guild.channel);
                    if (!guild.channel || !gChannel) return;

                    let invite;
                    try {
                        invite = await gChannel.createInvite({
                            maxAge: 86400
                        }, `Auto Bump Invite`);
                    } catch {
                        console.log("**Can't create my invite link qwq**");
                        return;
                    }

                    const count = await bump(interaction.guild.id, interaction.guild.name, interaction, interaction.user, interaction.client.emotes, interaction.client.colors); // Pass the user object
                    console.log(interaction.guild.name + "   >>>  auto-bumped!");
                    var channel = await interaction.client.guilds.cache.get(interaction.client.supportGuildId).channels.cache.get(interaction.client.supportGuildLogChannelId);
                    let embed = new EmbedBuilder();
                    embed.setDescription(`Auto-bumped ${interaction.guild.name}`)
                        .setColor(interaction.client.colors.success);
                    channel.send({ embeds: [embed] });

                    // Schedule a reminder to ping the user after 2 hours
                    setTimeout(async () => {
                        const reminderEmbed = new EmbedBuilder()
                            .setColor(interaction.client.colors.info)
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
                }, 7.2e+6); // 2 hours in milliseconds
            } else {
                clearInterval(interaction.client.autoBumpInterval);
            }

            return interaction.editReply({ content: `Auto-bumping is now ${guild.autoBump ? 'enabled' : 'disabled'}.` });
        } catch (error) {
            console.error(error);
            interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};
