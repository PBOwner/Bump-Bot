const fs = require("fs");
const { join } = require("path");
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const colors = {
    error: 0xF91A3C,
    info: 0x303136,
    success: 0x13EF8D
}
const emotes = {
    false: "",
    true: "",
    owner: "",
    bot: '',
    user: ''
}

const supportGuildId = ''
const supportGuildLogChannelId = ''
// Specify your bot token
const Bottoken = ''
// Insert your user ID if you want to use the status command
const ownerID = ""

const rawEmb = () => {
    return new EmbedBuilder()
        .setColor(colors.info);
}
module.exports = { rawEmb }

client.ownerID = ownerID
client.colors = colors
client.emotes = emotes
client.supportGuildId = supportGuildId
client.supportGuildLogChannelId = supportGuildLogChannelId

if (!Bottoken) throw new Error('Please enter a Bot Token!');

//==================================================================================================================================================
// Loading Things
//==================================================================================================================================================
const { Server, syncDatabase } = require('./database/dbInit');
var server_cache = new Collection();

Reflect.defineProperty(server_cache, "getGuild", {
    /**
     * @param {number} id Guild ID
     * @returns {Model} new User
     */
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
    /**
     *  @param {number} id Channel ID
     * @returns {Model} new User
     */
    value: async function () {
        let arr = []
        var channels = await Server.findAll();
        channels.forEach(entry => arr.push(entry.channel))
        return arr;
    }
});

// Sync
const initDatabase = async () => {
    await syncDatabase();

    try {
        for (let entr of (await Server.findAll())) {
            server_cache.set(entr.user_id, entr);
        }
        console.log(" >  Cached Database Entries");
    } catch (e) {
        console.log(" >  Error While Caching Database")
        console.log(e);
        // process.exit(1);
    }
}
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
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// Register slash commands
const rest = new REST({ version: '9' }).setToken(Bottoken);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(client.user.id, supportGuildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
//==================================================================================================================================================
// Starting the Bot
//==================================================================================================================================================
const start = async () => {
    try {
        console.log("Logging in...");
        await client.login(Bottoken).catch(e => {
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
}
start();

client.on("ready", () => {
    if (!supportGuildId) throw new Error('Please enter your Support-Guild-ID')
    if (!supportGuildLogChannelId) throw new Error('Please enter your Support-Guild-Log-Channel-ID')
    console.log(" >  Logged in as: " + client.user.tag);
    client.user.setPresence({ activities: [{ name: "Bump your server", type: 'PLAYING' }], status: 'idle' });
});

client.on('guildMemberAdd', async member => {
    let { guild } = member
    let settings = await client.database.server_cache.getGuild(guild.id)
    if (!settings.wlc) return
    let ch = await guild.channels.resolve(settings.wlc)
    if (!ch) {
        settings.wlc = undefined
        return settings.save()
    }
    let emb = rawEmb().setTitle('Member Joined').setDescription(`${member} joined **${guild.name}**! Welcome you'r member No. **${guild.memberCount}**`)
    ch.send({ embeds: [emb] }).catch(() => { })
})

client.on('guildCreate', async guild => {
    let supGuild = await client.guilds.resolve(supportGuildId)
    let channel = await supGuild.channels.resolve(supportGuildLogChannelId)
    let emb = rawEmb().setTitle('Server joined').setColor(colors.success).setDescription(guild.name)
    channel.send({ embeds: [emb] }).catch(() => { })
})

client.on('guildMemberRemove', async member => {
    let { guild } = member
    let settings = await client.database.server_cache.getGuild(guild.id)
    if (!settings.gb) return
    let ch = await guild.channels.resolve(settings.gb)
    if (!ch) {
        settings.gb = undefined
        return settings.save()
    }
    let emb = rawEmb().setTitle('Member Leaved').setDescription(`${member} leaved from **${guild.name}** Bye Bye`)
    ch.send({ embeds: [emb] }).catch(() => { })
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});
