module.exports = {
  name: 'groupadmins',
  aliases: ['admins', 'adminlist'],
  category: 'admin',
  description: 'List the group administrators',
  usage: '.groupadmins',
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const admins = (extra.groupMetadata?.participants || [])
      .filter(participant => participant.admin === 'admin' || participant.admin === 'superadmin');

    if (!admins.length) return extra.reply('No group administrators were found.');

    const mentions = admins.map(participant => participant.id || participant.lid).filter(Boolean);
    const lines = admins.map((participant, index) => {
      const id = participant.id || participant.lid;
      return `${index + 1}. @${id.split('@')[0]}`;
    });

    return sock.sendMessage(extra.from, {
      text: `👑 *GROUP ADMINS*\\n\\n${lines.join('\\n')}`,
      mentions
    }, { quoted: msg });
  }
};
