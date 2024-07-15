   const { ownerID } = require('../config.js');

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

           // Restart logic here
           process.exit();
       },
   };
