const database = require('../../database');

module.exports = {
  name: 'antiviewonce',
  aliases: ['antivo', 'viewonceguard'],
  category: 'admin',
  description: 'Automatically reveal view-once media posted in this group',
  usage: '.antiviewonce on|off|status',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const option = (args[0] || 'status').toLowerCase();
    const settings = database.getGroupSettings(extra.from);

    if (option === 'status') {
      return extra.reply(`👁️ *Antiviewonce:* ${settings.antiviewonce ? 'ON' : 'OFF'}`);
    }

    if (!['on', 'off'].includes(option)) {
      return extra.reply('Usage: .antiviewonce on | off | status');
    }

    database.updateGroupSettings(extra.from, { antiviewonce: option === 'on' });
    return extra.reply(`✅ Antiviewonce has been turned *${option.toUpperCase()}*.`);
  }
};
