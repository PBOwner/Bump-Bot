const fs = require("fs");
const { join } = require("path");
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config');
const { exec } = require('child_process'); // Import child_process

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const rawEmb = () => {
    return new EmbedBuilder()
        .setColor(config.colors.info);
};
module.exports = { rawEmb };

client.ownerID = config.ownerID;
client.colors = config.colors;
client.emotes = config.emotes;
client.supportGuildId = config.supportGuildId;
client.supportGuildLogChannelId = config.supportGuildLogChannelId;

if (!config.Bottoken) throw new Error('Please enter a Bot Token!');

//==================================================================================================================================================
// Loading Things
//==================================================================================================================================================
const { Server, syncDatabase } = require('./database/dbInit');
var server_cache = new Collection();
Reflect.defineProperty(server_cache, "getGuild", {
    value: async function (id) {
        var guild = server_cache.get(id);
        if (!guild) guild = await Server.findOne({ where: { key: id } });
        if (!guild) {
            guild = await Server.create({ key: id });
            server_cache.set(id, guild);
        }
        return guild;
    }
});
Reflect.defineProperty(server_cache, "getChannel", {
    value: async function () {
        let arr = [];
        var channels = await Server.findAll();
        channels.forEach(entry => arr.push(entry.channel));
        return arr;
    }
});

const initDatabase = async () => {
    await syncDatabase();
    try {
        for (let entr of (await Server.findAll())) {
            server_cache.set(entr.user_id, entr);
        }
        console.log(" >  Cached Database Entries");
    } catch (e) {
        console.log(" >  Error While Caching Database");
        console.log(e);
    }
};
client.database = { server_cache };

//==================================================================================================================================================
// Initialize the Commands
//==================================================================================================================================================
client.commands = new Collection();
const commandFiles = fs
    .readdirSync("./commands")
    .filter(file => file.endsWith(".js"));
const commands = [];
for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if (!command.data || !command.data.name) {
            console.error(`The command at './commands/${file}' is missing a required "data" or "name" property.`);
            continue;
        }
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } catch (error) {
        console.error(`Error loading command at './commands/${file}':`, error);
    }
}

const rest = new REST({ version: '9' }).setToken(config.Bottoken);

//==================================================================================================================================================
// Starting the Bot
//==================================================================================================================================================
const start = async () => {
    try {
        console.log("Logging in...");
        await client.login(config.Bottoken).catch(e => {
            console.log(e.code);
            switch (e.code) {
                case 'TOKEN_INVALID':
                    console.error(" >  Invalid Token");
                    break;
                case 500:
                    console.error(" >  Fetch Error");
                    break;
                default:
                    console.error(" >  Unknown Error");
                    console.error(' > ' + e);
                    break;
            }
            setTimeout(() => { throw e }, 5000);
        });
        await initDatabase();
    } catch (e) {
        console.log(e);
    }
};

// Function to check for updates
const checkForUpdates = async () => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.github.com/repos/PBOwner/Bump-Bot/commits/main');
        const data = await response.json();
        const latestCommit = data[0].sha; // Get the latest commit SHA

        const currentCommit = fs.existsSync('current_commit.txt') ? fs.readFileSync('current_commit.txt', 'utf8') : '';

        if (latestCommit !== currentCommit) {
            console.log('New update detected. Restarting bot...');
            fs.writeFileSync('current_commit.txt', latestCommit);

            // Use pm2 to restart the bot
            exec('pm2 restart bump-bot', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error restarting bot: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
        } else {
            console.log('No updates found.');
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
};

// Start the bot and check for updates every 10 minutes
start();
setInterval(checkForUpdates, 10 * 60 * 1000);

client.once("ready", async () => {
    if (!config.supportGuildId) throw new Error('Please enter your Support-Guild-ID');
    if (!config.supportGuildLogChannelId) throw new Error('Please enter your Support-Guild-Log-Channel-ID');
    console.log(" >  Logged in as: " + client.user.tag);
    client.user.setPresence({ activities: [{ name: "Bump your server", type: 'PLAYING' }], status: 'idle' });
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// Event: guildMemberAdd
client.on('guildMemberAdd', async member => {
    let { guild } = member;
    let settings = await client.database.server_cache.getGuild(guild.id);
    if (!settings.wlc) return;
    let ch = await guild.channels.resolve(settings.wlc);
    if (!ch) {
        settings.wlc = undefined;
        return settings.save();
    }
    let emb = rawEmb().setTitle('Member Joined').setDescription(`${member} joined **${guild.name}**! Welcome you'r member No. **${guild.memberCount}**`);
    ch.send({ embeds: [emb] }).catch(() => { });
});

// Event: guildCreate
client.on('guildCreate', async guild => {
    let supGuild = await client.guilds.resolve(config.supportGuildId);
    let channel = await supGuild.channels.resolve(config.supportGuildLogChannelId);
    let owner = await guild.fetchOwner();
    let emb = rawEmb()
        .setTitle('Server joined')
        .setColor(config.colors.success)
        .setDescription(`**Server Name:** ${guild.name}\n**Server ID:** ${guild.id}\n**Owner Name:** ${owner.user.tag}\n**Owner ID:** ${owner.user.id}`);
    channel.send({ embeds: [emb] }).catch(() => { });
});

// Event: guildMemberRemove
client.on('guildMemberRemove', async member => {
    let { guild } = member;
    let settings = await client.database.server_cache.getGuild(guild.id);
    if (!settings.gb) return;
    let ch = await guild.channels.resolve(settings.gb);
    if (!ch) {
        settings.gb = undefined;
        return settings.save();
    }
    let emb = rawEmb().setTitle('Member Leaved').setDescription(`${member} leaved from **${guild.name}** Bye Bye`);
    ch.send({ embeds: [emb] }).catch(() => { });
});

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
            await interaction.followUp({ content: 'Ad reported successfully.', ephemeral: true });
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

                await interaction.update({ content: 'Server approved. You can unblock it if needed.', components: [row] });
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

// Handle uncaught exceptions and rejections
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});
