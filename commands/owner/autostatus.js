const fs = require('fs');
const path = require('path');
const isOwner = require('../../lib/isOwner');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363418258890415@newsletter',
            newsletterName: 'Hunter_254',
            serverMessageId: -1
        }
    }
};

const configPath = path.join(__dirname, '../data/autoStatus.json');

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            const defaultConfig = {
                enabled: false,
                reactOn: false
            };

            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }

        return JSON.parse(fs.readFileSync(configPath));
    } catch {
        return {
            enabled: false,
            reactOn: false
        };
    }
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {

        const senderId = msg.key.participant || msg.key.remoteJid;
        const owner = await isOwner(senderId);

        if (!msg.key.fromMe && !owner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command can only be used by the owner!',
                ...channelInfo
            });
            return;
        }

        let config = loadConfig();

        if (!args.length) {

            const status = config.enabled ? "enabled" : "disabled";
            const react = config.reactOn ? "enabled" : "disabled";

            return sock.sendMessage(chatId, {
                text: `🔄 *Auto Status Settings*

📱 Auto Status View : ${status}
💫 Status Reactions : ${react}

Commands:
.autostatus on
.autostatus off
.autostatus react on
.autostatus react off`,
                ...channelInfo
            });
        }

        const command = args[0].toLowerCase();

        if (command === "on") {
            config.enabled = true;
            saveConfig(config);

            return sock.sendMessage(chatId, {
                text: "✅ Auto status viewing enabled.",
                ...channelInfo
            });
        }

        if (command === "off") {
            config.enabled = false;
            saveConfig(config);

            return sock.sendMessage(chatId, {
                text: "❌ Auto status viewing disabled.",
                ...channelInfo
            });
        }

        if (command === "react") {

            if (!args[1]) {
                return sock.sendMessage(chatId, {
                    text: "❌ Use: .autostatus react on/off",
                    ...channelInfo
                });
            }

            const mode = args[1].toLowerCase();

            if (mode === "on") {
                config.reactOn = true;
                saveConfig(config);

                return sock.sendMessage(chatId, {
                    text: "💫 Status reactions enabled.",
                    ...channelInfo
                });
            }

            if (mode === "off") {
                config.reactOn = false;
                saveConfig(config);

                return sock.sendMessage(chatId, {
                    text: "❌ Status reactions disabled.",
                    ...channelInfo
                });
            }
        }

        await sock.sendMessage(chatId, {
            text: "❌ Invalid command.",
            ...channelInfo
        });

    } catch (error) {

        console.error("Autostatus command error:", error);

        await sock.sendMessage(chatId, {
            text: "❌ Error occurred:\n" + error.message,
            ...channelInfo
        });
    }
}

function isAutoStatusEnabled() {
    return loadConfig().enabled;
}

function isStatusReactionEnabled() {
    return loadConfig().reactOn;
}

async function reactToStatus(sock, statusKey) {

    try {

        if (!isStatusReactionEnabled()) return;

        const participant = statusKey.participant || statusKey.remoteJid;

        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: statusKey,
                    text: '💚',
                    senderTimestampMs: Date.now()
                }
            },
            {
                statusJidList: [participant]
            }
        );

    } catch (error) {
        console.error("Reaction error:", error);
    }
}

async function handleStatusUpdate(sock, status) {

    try {

        if (!isAutoStatusEnabled()) return;

        await new Promise(r => setTimeout(r, 1500));

        if (!status.messages) return;

        const msg = status.messages[0];

        if (!msg?.key) return;

        if (msg.key.remoteJid !== 'status@broadcast') return;

        try {

            await sock.readMessages([msg.key]);

            await reactToStatus(sock, msg.key);

        } catch (err) {

            if (err.message?.includes("rate-overlimit")) {

                console.log("⚠️ Rate limit detected, retrying...");

                await new Promise(r => setTimeout(r, 3000));

                await sock.readMessages([msg.key]);
            }
        }

    } catch (error) {

        console.error("Auto status error:", error.message);
    }
}

module.exports = {
    name: "autostatus",
    aliases: [],
    execute: async (sock, msg, args) => {
        const chatId = msg.key.remoteJid;
        await autoStatusCommand(sock, chatId, msg, args);
    },
    handleStatusUpdate
};