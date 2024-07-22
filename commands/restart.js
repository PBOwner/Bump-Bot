const { ownerID } = require('../config.js');
const { exec } = require('child_process');

module.exports = {
    data: {
        name: 'restart',
        description: 'Restarts the bot (Owner only)',
    },
    async execute(interaction) {
        // Check if the interaction user is the bot owner
        if (interaction.user.id !== ownerID) {
            return interaction.reply('You do not have permission to use this command.');
        }

        // Confirm restart
        await interaction.reply('Restarting the bot...');

        // Restart logic here using systemctl
        exec('systemctl restart bump', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error restarting the bot: ${error.message}`);
                return interaction.followUp('Failed to restart the bot.');
            }

            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return interaction.followUp('Bot restarted with warnings.');
            }

            console.log(`Stdout: ${stdout}`);
            interaction.followUp('Bot restarted successfully.');
        });
    },
};
