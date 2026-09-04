module.exports = {
  name: 'setsubject',
  aliases: ['setname', 'groupname'],
  category: 'admin',
  description: 'Change the group subject',
  usage: '.setsubject <new group name>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const subject = args.join(' ').trim();
    if (!subject) return extra.reply('Usage: .setsubject <new group name>');
    if (subject.length > 100) return extra.reply('❌ The group name is too long.');

    await sock.groupUpdateSubject(extra.from, subject);
    return extra.reply(`✅ Group name changed to: *${subject}*`);
  }
};
