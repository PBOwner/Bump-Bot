// config.js
const colors = {
    error: 0xF91A3C,
    info: 0x303136,
    success: 0x13EF8D
};

const emotes = {
    false: "",
    true: "",
    owner: "",
    bot: '',
    user: ''
};

const supportGuildId = ''; // Your support guild ID
const supportGuildLogChannelId = ''; // Your support guild log channel ID
const Bottoken = ''; // Specify your bot token
const ownerID = ''; // Insert your user ID if you want to use the status command
const reportChannelId = ''; // Add the report channel ID
const supportInviteLink = 'https://discord.gg/yourSupportInviteLink'; // Add your fixed support server invite link
const reportApprovalRoleId = ''; // Add the role ID that can approve or deny reports

module.exports = {
    colors,
    emotes,
    supportGuildId,
    supportGuildLogChannelId,
    Bottoken,
    ownerID,
    reportChannelId,
    supportInviteLink, // Export the support invite link
    reportApprovalRoleId // Export the report approval role ID
};
