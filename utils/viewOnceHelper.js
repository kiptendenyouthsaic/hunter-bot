const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function extractViewOnceMessage(message) {
  if (!message) return null;

  const wrappers = [
    message.viewOnceMessageV2Extension?.message,
    message.viewOnceMessageV2?.message,
    message.viewOnceMessage?.message
  ];

  for (const wrapped of wrappers) {
    if (wrapped) {
      const type = Object.keys(wrapped)[0];
      if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
        return { type, message: wrapped[type] };
      }
    }
  }

  for (const type of ['imageMessage', 'videoMessage', 'audioMessage']) {
    if (message[type]?.viewOnce) return { type, message: message[type] };
  }

  return null;
}

async function downloadViewOnce(payload) {
  const downloadType = payload.type === 'imageMessage'
    ? 'image'
    : payload.type === 'videoMessage'
      ? 'video'
      : 'audio';

  const stream = await downloadContentFromMessage(payload.message, downloadType);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function sendViewOnce(sock, chatId, payload, options = {}) {
  const buffer = await downloadViewOnce(payload);
  const caption = payload.message.caption || '';
  const quoted = options.quoted ? { quoted: options.quoted } : undefined;

  if (payload.type === 'imageMessage') {
    return sock.sendMessage(chatId, {
      image: buffer,
      caption,
      mimetype: payload.message.mimetype || 'image/jpeg'
    }, quoted);
  }

  if (payload.type === 'videoMessage') {
    return sock.sendMessage(chatId, {
      video: buffer,
      caption,
      mimetype: payload.message.mimetype || 'video/mp4'
    }, quoted);
  }

  return sock.sendMessage(chatId, {
    audio: buffer,
    ptt: Boolean(payload.message.ptt),
    mimetype: payload.message.mimetype || 'audio/ogg; codecs=opus'
  }, quoted);
}

module.exports = { extractViewOnceMessage, downloadViewOnce, sendViewOnce };
