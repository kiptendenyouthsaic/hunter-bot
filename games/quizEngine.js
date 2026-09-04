async function checkAnswer(sock,msg){

    const from = msg.key.remoteJid

    if(!games[from]) return false

    const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text

    const game = games[from]

    if(game.type === "capital"){

        const index = parseInt(text)-1

        if(isNaN(index) || !game.options[index]) return false

        const chosen = game.options[index].name.common

        if(chosen === game.answer){

            await sock.sendMessage(from,{ text:"✅ Correct!" })

        } else {

            await sock.sendMessage(from,{
                text:`❌ Wrong!\nCorrect answer: *${game.answer}*`
            })

        }

        delete games[from]

        return true
    }

    return false
}