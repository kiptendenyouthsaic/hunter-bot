/**
 * Football Team Info Command
 */

const axios = require("axios");

module.exports = {
  name: "team",
  aliases: ["club", "footballteam"],
  category: "sports",
  description: "Get football team information",
  usage: ".team <team name>",

  async execute(sock, msg, args) {
    try {

      const teamName = args.join(" ");

      if (!teamName) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "⚽ Please provide a team name.\nExample: .team manchester united" },
          { quoted: msg }
        );
      }

      const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;

      const { data } = await axios.get(url);

      if (!data.teams || data.teams.length === 0) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Team not found." },
          { quoted: msg }
        );
      }

      const team = data.teams[0];

      const text =
`⚽ *${team.strTeam}*

🏆 League: ${team.strLeague || "Unknown"}
📅 Founded: ${team.intFormedYear || "Unknown"}
🌍 Country: ${team.strCountry || "Unknown"}
🏟 Stadium: ${team.strStadium || "Unknown"}
👥 Capacity: ${team.intStadiumCapacity || "Unknown"}
`;

      // If badge exists send image
      if (team.strTeamBadge) {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            image: { url: team.strTeamBadge },
            caption: text
          },
          { quoted: msg }
        );
      } else {
        // otherwise send text only
        await sock.sendMessage(
          msg.key.remoteJid,
          { text },
          { quoted: msg }
        );
      }

    } catch (error) {

      console.error("Team command error:", error);

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to fetch team information." },
        { quoted: msg }
      );
    }
  }
};