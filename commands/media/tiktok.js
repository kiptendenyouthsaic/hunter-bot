/**
 * TikTok Downloader - Stable Version
 */

const axios = require("axios");
const config = require("../../config");

// prevent duplicate processing
const processedMessages = new Set();

async function getTikTok(url) {
  const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

  const response = await axios.get(api, {
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.data || !response.data.data) {
    throw new Error("Invalid TikTok API response");
  }

  return {
    video: response.data.data.play,
    title: response.data.data.title || "TikTok Video"
  };
}

module.exports = {
  name: "tiktok",
  aliases: ["tt", "ttdl", "tiktokdl"],
  category: "media",
  description: "Download TikTok videos",
  usage: ".tiktok <TikTok URL>",

  async execute(sock, msg, args) {
    try {

      if (processedMessages.has(msg.key.id)) return;
      processedMessages.add(msg.key.id);

      setTimeout(() => {
        processedMessages.delete(msg.key.id);
      }, 300000);

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        args.join(" ");

      if (!text) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Please provide a TikTok link." },
          { quoted: msg }
        );
      }

      const url = text.split(" ").slice(1).join(" ").trim();

      if (!url) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Please provide a TikTok link." },
          { quoted: msg }
        );
      }

      // validate TikTok link
      const tiktokRegex =
        /https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/;

      if (!tiktokRegex.test(url)) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Invalid TikTok link." },
          { quoted: msg }
        );
      }

      // reaction
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "⏳", key: msg.key }
      });

      let videoUrl;
      let title;

      try {
        const result = await getTikTok(url);
        videoUrl = result.video;
        title = result.title;
      } catch (apiError) {
        console.error("TikTok API error:", apiError.message);

        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Failed to fetch TikTok video." },
          { quoted: msg }
        );
      }

      const caption =
        `*DOWNLOADED BY ${config.botName.toUpperCase()}*\n\n` +
        `🎬 Title: ${title}`;

      try {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: caption
          },
          { quoted: msg }
        );

        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "✅", key: msg.key }
        });

      } catch (sendError) {
        console.error("Send video error:", sendError);

        await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Failed to send the TikTok video." },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error("TikTok command error:", error);

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ An unexpected error occurred." },
        { quoted: msg }
      );
    }
  }
};