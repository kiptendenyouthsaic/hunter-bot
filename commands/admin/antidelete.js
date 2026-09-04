const database = require('../../database');

module.exports = {
  name: 'antidelete',
  aliases: ['antidel', 'deleteguard'],
  category: 'admin',
  description: 'Automatically recover deleted messages in this group',
  usage: '.antidelete on|off|status',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const option = (args[0] || 'status').toLowerCase();
    const settings = database.getGroupSettings(extra.from);

    if (option === 'status') {
      return extra.reply(`🛡️ *Antidelete:* ${settings.antidelete ? 'ON' : 'OFF'}`);
    }

    if (!['on', 'off'].includes(option)) {
      return extra.reply('Usage: .antidelete on | off | status');
    }

    database.updateGroupSettings(extra.from, { antidelete: option === 'on' });
    return extra.reply(`✅ Antidelete has been turned *${option.toUpperCase()}*.`);
  }
};
