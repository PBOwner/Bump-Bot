const fs = require("fs");
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
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

client.ownerID = config.ownerID;
client.colors = config.colors;
client.emotes = config.emotes;
client.supportGuildId = config.supportGuildId;
client.supportGuildLogChannelId = config.supportGuildLogChannelId;
client.reportChannelId = config.reportChannelId; // Add report channel ID to the client

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
        commands.push(command.data);
    } catch (error) {
        console.error(`Error loading command at './commands/${file}':`, error);
    }
}

const rest = new REST({ version: '10' }).setToken(config.Bottoken);

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

// Start the bot
start();

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
    console.log('Color for info:', config.colors.info); // Debugging statement
    let emb = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('Member Joined')
        .setDescription(`${member} joined **${guild.name}**! Welcome you'r member No. **${guild.memberCount}**`);
    ch.send({ embeds: [emb] }).catch(() => { });
});

// Event: guildCreate
client.on('guildCreate', async guild => {
    let supGuild = await client.guilds.resolve(config.supportGuildId);
    let channel = await supGuild.channels.resolve(config.supportGuildLogChannelId);
    let owner = await guild.fetchOwner();
    console.log('Color for success:', config.colors.success); // Debugging statement
    let emb = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('Server joined')
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
    console.log('Color for info:', config.colors.info); // Debugging statement
    let emb = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('Member Leaved')
        .setDescription(`${member} leaved from **${guild.name}** Bye Bye`);
    ch.send({ embeds: [emb] }).catch(() => { });
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            const settings = await client.database.server_cache.getGuild(interaction.guildId);
            if (settings.blocked) {
                await interaction.reply({ content: 'This server is banned from using the bot.', ephemeral: true });
                return;
            }
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'reportModal') {
            const guildId = interaction.fields.getTextInputValue('guildId');
            const reason = interaction.fields.getTextInputValue('reason');
            const reportChannel = await interaction.client.channels.fetch(config.reportChannelId);

            const reportEmbed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('Bump Report')
                .addFields(
                    { name: 'Server ID', value: guildId },
                    { name: 'Reporter', value: interaction.user.tag },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_${guildId}`)
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`deny_${guildId}`)
                        .setLabel('Deny')
                        .setStyle(ButtonStyle.Danger)
                );

            reportChannel.send({ embeds: [reportEmbed], components: [row] });
            await interaction.reply({ content: 'Thank you for your report. It has been sent to the moderators.', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        const [action, guildId] = interaction.customId.split('_');
        if (action === 'approve') {
            // Handle approve action
            const settings = await client.database.server_cache.getGuild(guildId);
            settings.blocked = true;
            await settings.save();
            await interaction.reply({ content: 'The server has been blocked from being bumped.', ephemeral: true });
        } else if (action === 'deny') {
            // Handle deny action
            await interaction.reply({ content: 'The report has been dismissed.', ephemeral: true });
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
