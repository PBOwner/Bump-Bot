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
```

3. **Update your command files (`bump.js` in this example) to handle slash commands:**

```javascript
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const ms = require('parse-ms');
const { rawEmb } = require('../index'); // Adjust the path to import rawEmb if needed
const { ownerID } = require('../index'); // Import ownerId from index.js

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bumps your Server'),

    async execute(interaction) {
        const { colors, emotes } = interaction.client;

        let emb = rawEmb();
        var guild = await interaction.client.database.server_cache.getGuild(interaction.guild.id);

        if (guild.description == 0) {
            emb.setDescription("This Server has no description! please set one qwq");
            return interaction.reply({ embeds: [emb.setColor(colors.error)], ephemeral: true });
        }

        const gChannel = await interaction.guild.channels.cache.get(guild.channel);
        if (guild.channel == 0 || !gChannel) {
            return interaction.reply({ embeds: [emb.setDescription('Please set a valid channel before you bump your server :3').setColor(colors.error)], ephemeral: true });
        }

        let bumped_time = guild.time;
        let now = Date.now();
        if (bumped_time == 0) bumped_time = now - 8.64e+7;
        let cooldown = 7.2e+6;
        let time = ms(cooldown - (now - bumped_time));

        if (guild.channel == 0) {
            guild.channel = interaction.channel.id;
            await guild.save();
        } else {
            let F = interaction.client.channels.resolve(guild.channel);
            if (!F) {
                guild.channel = interaction.channel.id;
                await guild.save();
            }
        }

        let invite;
        try {
            invite = await interaction.channel.createInvite({
                maxAge: 86400
            }, `Bump Invite`);
        } catch {
            return interaction.reply({ embeds: [emb.setDescription("**Can't create my invite link qwq**").setColor(colors.error)], ephemeral: true });
        }

        let segments = [];
        if (time.hours > 0) segments.push(time.hours + ' Hour' + ((time.hours == 1) ? '' : 's'));
        if (time.minutes > 0) segments.push(time.minutes + ' Minute' + ((time.minutes == 1) ? '' : 's'));

        const timeString = segments.join('\n');

        // Check if the user is the owner
        if (interaction.user.id !== ownerID && cooldown - (now - bumped_time) > 0) {
            emb.setColor(colors.error)
                .setDescription(`**${timeString}**`)
                .setTitle("You have to wait ;-;");
            return interaction.reply({ embeds: [emb], ephemeral: true });
        } else {
            guild.time = now;
            await guild.save();
            const count = await bump(interaction.guild.id, interaction.guild.name, interaction, interaction.user, interaction.client.emotes, interaction.client.colors); // Pass the user object
            emb.setDescription(`**Bumped successfully to ${count} Server**`)
                .setColor(colors.success);
            interaction.reply({ embeds: [emb] });
            console.log(interaction.guild.name + "   >>>  bumped!");
            var channel = await interaction.client.guilds.cache.get(interaction.client.supportGuildId).channels.cache.get(interaction.client.supportGuildLogChannelId);
            channel.send({ embeds: [emb.setDescription(interaction.user.tag + ' bumped ' + interaction.guild.name)] });
        }
    }
};

async function bump(id, title, interaction, user, emotes, colors) {
    var G = await interaction.client.database.server_cache.getGuild(id);
    let invite = await interaction.channel.createInvite({});
    let emb = rawEmb();

    emb.setTitle(title)
        .setDescription(` \n **Description:**\n ${G.description}
        \n **Invite: [click](${"https://discord.gg/" + invite.code})**
        \n :globe_with_meridians: ${interaction.guild.preferredLocale}
        \n ${emotes.user} ${interaction.guild.memberCount}
        `)
        .setColor(G.color != 0 ? G.color : colors.info)
        .setAuthor({ name: user.username + " bumped: ", iconURL: interaction.guild.iconURL() || user.displayAvatarURL() }) // Use user.username and user.displayAvatarURL()
        .setTimestamp();

    let ch = 0;
    let channels = await interaction.client.database.server_cache.getChannel();
    var i = 0;

    for (const c of channels) {
        if (c == 0) return;
        ch = await interaction.client.channels.resolve(c);
        if (!ch) return;
        i++;
        ch.send({ embeds: [emb] }).catch(() => { });
    }
    return i - 1;
}
