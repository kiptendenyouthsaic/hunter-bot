const questions = require("../database/movieQuestions.json")

const games = {}

function startGame(sock, chatId){

if(games[chatId]){
sock.sendMessage(chatId,{text:"⚠️ A movie game is already running"})
return
}

const q = questions[Math.floor(Math.random()*questions.length)]

const timer = setTimeout(async()=>{

if(!games[chatId]) return

await sock.sendMessage(chatId,{
text:`⏰ Time's up!\nAnswer: *${games[chatId].answer}*`
})

delete games[chatId]

},30000)

games[chatId] = {
answer:q.answer,
timer
}

sock.sendMessage(chatId,{
text:`🎬 *Guess The Movie*\n\n${q.emoji}\n\nReply with the movie name\n⏱ 30 seconds`
})

}

function checkAnswer(sock, chatId, body, sender){

const game = games[chatId]

if(!game) return false

if(body.toLowerCase().includes(game.answer)){

clearTimeout(game.timer)

sock.sendMessage(chatId,{
text:`🎉 Correct!\n@${sender.split("@")[0]} guessed the movie!`,
mentions:[sender]
})

delete games[chatId]

return true
}

return false
}

module.exports = {
startGame,
checkAnswer
}