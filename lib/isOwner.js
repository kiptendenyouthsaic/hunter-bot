/**
 * Owner Checker
 * Checks if a sender is the bot owner or sudo user
 */

const settings = require('../settings');

function isOwnerOrSudo(sender) {
    try {
        if (!sender) return false;

        // Remove WhatsApp suffix
        const senderNumber = sender.split('@')[0];

        // Owner numbers from settings
        const owners = settings.owner || [];

        // Check if sender is owner
        if (owners.includes(senderNumber)) {
            return true;
        }

        return false;

    } catch (error) {
        console.error('Owner check error:', error);
        return false;
    }
}

module.exports = isOwnerOrSudo;