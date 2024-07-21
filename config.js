const colors = {
    error: 0xF91A3C,    // Red
    info: 0x303136,     // Dark gray
    success: 0x13EF8D   // Green
};

const emotes = {
    false: "❌",
    true: "✅",
    owner: "👑",
    bot: "🤖",
    user: "👤"
};

const supportGuildId = 'YOUR_SUPPORT_GUILD_ID'; // Your support guild ID
const supportGuildLogChannelId = 'YOUR_SUPPORT_GUILD_LOG_CHANNEL_ID'; // Your support guild log channel ID
const Bottoken = 'YOUR_BOT_TOKEN'; // Specify your bot token
const ownerID = 'YOUR_USER_ID'; // Insert your user ID if you want to use the status command
const reportChannelId = 'YOUR_REPORT_CHANNEL_ID'; // Add the report channel ID
const supportInviteLink = 'https://discord.gg/yourSupportInviteLink'; // Add your fixed support server invite link
const reportApprovalRoleId = 'YOUR_REPORT_APPROVAL_ROLE_ID'; // Add the role ID that can approve or deny reports

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
