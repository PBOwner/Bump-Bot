const fs = require("fs");
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');
const { exec } = require('child_process'); // Import child_process

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.sqlitePath,
    logging: false, // Disable logging if you prefer
});

// Define the Server model
const Server = sequelize.define('Server', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ownerName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    prefix: {
        type: DataTypes.STRING,
        defaultValue: '%',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '0',
    },
    time: {
        type: DataTypes.STRING,
        defaultValue: '0',
    },
    channel: {
        type: DataTypes.STRING,
        defaultValue: '0',
    },
    wlc: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gb: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    partner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    ban: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    premium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    premiumRedeemedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    ownerId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

// Define the PremiumCode model
const PremiumCode = sequelize.define('PremiumCode', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    redeemed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
});

// Sync Database
const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync({ alter: true }); // Use alter or force as necessary
        console.log('Database synchronized');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

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
Reflect.defineProperty(server_cache, "getAllGuilds", {
    value: async function () {
        return await Server.findAll();
    }
});

const initDatabase = async () => {
    await syncDatabase();
    try {
        for (let entr of (await Server.findAll())) {
            server_cache.set(entr.key, entr); // Use `key` instead of `user_id`
        }
        console.log(" >  Cached Database Entries");
    } catch (e) {
        console.log(" >  Error While Caching Database");
        console.log(e);
    }
};
client.database = { server_cache, PremiumCode };

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
        commands.push(command.data.toJSON()); // Ensure toJSON() is used here
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

// Add the client.once("ready", async () => { ... }) block here
client.once("ready", async () => {
    if (!config.supportGuildId) throw new Error('Please enter your Support-Guild-ID');
    if (!config.supportGuildLogChannelId) throw new Error('Please enter your Support-Guild-Log-Channel-ID');
    console.log(" >  Logged in as: " + client.user.tag);

    const statuses = [
        { activity: { name: `${client.guilds.cache.size} servers | /help`, type: 'WATCHING' }, status: 'online' },
        { activity: { name: 'with code', type: 'PLAYING' }, status: 'idle' },
        { activity: { name: 'your commands', type: 'LISTENING' }, status: 'dnd' }
    ];

    let currentStatusIndex = 0;

    const updatePresence = () => {
        const { activity, status } = statuses[currentStatusIndex];
        client.user.setPresence({
            activities: [activity],
            status: status
        });
        currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
    };

    updatePresence();
    setInterval(updatePresence, 60000); // Update presence every minute

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

            // Fetch server description from memory
            const settings = await client.database.server_cache.getGuild(guildId);
            const serverDescription = settings.description || 'No description available';

            const reportEmbed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('Bump Report')
                .addFields(
                    { name: 'Server ID', value: guildId },
                    { name: 'Reporter', value: interaction.user.tag },
                    { name: 'Reason', value: reason },
                    { name: 'Server Description', value: serverDescription } // Include server description
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
        const message = interaction.message;
        const buttons = message.components[0].components;

        // Disable both buttons
        buttons.forEach(button => button.setDisabled(true));
        const row = new ActionRowBuilder().addComponents(buttons);

        if (action === 'approve') {
            // Handle approve action
            const settings = await client.database.server_cache.getGuild(guildId);
            settings.blocked = true;
            await settings.save();
            await interaction.update({ content: 'The server has been blocked from being bumped.', components: [row], embeds: message.embeds });
        } else if (action === 'deny') {
            // Handle deny action
            await interaction.update({ content: 'The report has been dismissed.', components: [row], embeds: message.embeds });
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
