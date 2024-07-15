const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, MessageActionRow, MessageButton } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config'); // Import config

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
        let arr = [];
        var channels = await Server.findAll();
        channels.forEach(entry => arr.push(entry.channel));
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
        console.log(" >  Error While Caching Database");
        console.log(e);
        // process.exit(1);
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
// Register slash commands
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
start();
client.on("ready", async () => {
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
            const reportChannelId = config.reportChannelId; // Add this to your config
            const reportChannel = await interaction.client.channels.fetch(reportChannelId);
            const embed = interaction.message.embeds[0];

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('approve')
                        .setLabel('Approve')
                        .setStyle('SUCCESS'),
                    new MessageButton()
                        .setCustomId('deny')
                        .setLabel('Deny')
                        .setStyle('DANGER')
                );

            reportChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Ad reported successfully.', ephemeral: true });
        } else if (interaction.customId === 'approve') {
            const embed = interaction.message.embeds[0];
            const guildId = embed.author.name.split(' ')[0]; // Assuming the author field contains the guild ID
            const guild = await interaction.client.database.server_cache.getGuild(guildId);
            guild.blocked = true;
            await guild.save();

            await interaction.reply({ content: 'Server blocked from using the bot.', ephemeral: true });
        } else if (interaction.customId === 'deny') {
            await interaction.reply({ content: 'Report dismissed.', ephemeral: true });
        }
    }
});
