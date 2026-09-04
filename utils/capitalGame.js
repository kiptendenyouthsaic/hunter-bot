const games = {}

function setGame(chatId, data, sock) {

    // Clear existing game if any
    if (games[chatId] && games[chatId].timer) {
        clearTimeout(games[chatId].timer)
    }

    // Create timeout (30 seconds)
    const timer = setTimeout(async () => {

        if (!games[chatId]) return

        try {
            await sock.sendMessage(chatId, {
                text: `⏰ Time's up!\nCorrect answer: *${games[chatId].country}*`
            })
        } catch (e) {}

        delete games[chatId]

    }, 30000)

    games[chatId] = {
        ...data,
        timer
    }
}

function getGame(chatId) {
    return games[chatId]
}

function deleteGame(chatId) {

    if (games[chatId]?.timer) {
        clearTimeout(games[chatId].timer)
    }

    delete games[chatId]
}

module.exports = {
    setGame,
    getGame,
    deleteGame
}