module.exports = {
  name: 'setdescription',
  aliases: ['setdesc', 'groupdesc'],
  category: 'admin',
  description: 'Change the group description',
  usage: '.setdescription <new description>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const description = args.join(' ').trim();
    if (!description) return extra.reply('Usage: .setdescription <new description>');

    await sock.groupUpdateDescription(extra.from, description);
    return extra.reply('✅ Group description updated successfully.');
  }
};
