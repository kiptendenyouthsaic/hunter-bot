const fs = require("fs")
const path = require("path")

const games = {}

const questions = require("../database/movieQuestions.json")

const scoreFile = path.join(__dirname,"../database/movieScores.json")

let scores = {}

if(fs.existsSync(scoreFile)){
scores = JSON.parse(fs.readFileSync(scoreFile))
}

function saveScores(){
fs.writeFileSync(scoreFile,JSON.stringify(scores,null,2))
}

function startGame(sock,chatId,sender){

if(games[chatId]){
sock.sendMessage(chatId,{text:"⚠️ A movie quiz is already running"})
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

games[chatId]={
answer:q.answer.toLowerCase(),
timer
}

sock.sendMessage(chatId,{
text:`🎬 *Guess The Movie*\n\n${q.emoji}\n\nReply with the movie name\n⏱ 30 seconds`
})

}

function checkAnswer(sock,chatId,sender,body){

const game = games[chatId]

if(!game) return false

if(body.toLowerCase().includes(game.answer)){

clearTimeout(game.timer)

if(!scores[sender]) scores[sender]={points:0,streak:0}

scores[sender].points++
scores[sender].streak++

saveScores()

sock.sendMessage(chatId,{
text:`🎉 Correct!\n🔥 Streak: ${scores[sender].streak}\n🏆 Points: ${scores[sender].points}`,
mentions:[sender]
})

delete games[chatId]

return true
}

return false
}

function leaderboard(sock,chatId){

const sorted = Object.entries(scores)
.sort((a,b)=>b[1].points-a[1].points)
.slice(0,10)

if(sorted.length===0){
sock.sendMessage(chatId,{text:"🎬 No movie scores yet."})
return
}

let text="🏆 *Movie Quiz Leaderboard*\n\n"

const medals=["🥇","🥈","🥉"]

sorted.forEach((u,i)=>{

const rank = medals[i] || `${i+1}.`

text+=`${rank} ${u[0].split("@")[0]} — ${u[1].points} pts\n`

})

sock.sendMessage(chatId,{text})

}

module.exports = {
startGame,
checkAnswer,
leaderboard
}