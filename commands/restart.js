const { ownerID } = require('../config.js');

module.exports = {
    name: 'restart',
    description: 'Restarts the bot (Owner only)',
    execute(message, args) {
        // Check if the message author is the bot owner
        if (message.author.id !== ownerID) {
            return message.reply('You do not have permission to use this command.');
        }

        // Confirm restart
        message.channel.send('Restarting the bot...').then(() => {
            // Restart logic here
            process.exit();
        }).catch(err => {
            console.error('Error while restarting the bot:', err);
            message.reply('There was an error trying to restart the bot.');
        });
    },
};
