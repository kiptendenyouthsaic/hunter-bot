const axios = require("axios")
const { setGame } = require("../../utils/capitalGame")

module.exports = {
    name: "capital",
    description: "Capital city quiz",
    category: "fun",
    usage: ".capital",

    async execute(sock, msg) {

        const from = msg.key.remoteJid

        const res = await axios.get(
            "https://restcountries.com/v3.1/all?fields=name,capital"
        )

        const countries = res.data.filter(c => c.capital)

        const options = countries.sort(() => 0.5 - Math.random()).slice(0,4)

        const correctIndex = Math.floor(Math.random()*4)

        const correct = options[correctIndex]

        let text = `🌍 *Capital Quiz*\n\n`
        text += `Which country has this capital?\n\n`
        text += `🏙️ *${correct.capital[0]}*\n\n`

        options.forEach((c,i)=>{
            text += `${i+1}. ${c.name.common}\n`
        })

        text += `\nReply with 1,2,3 or 4.`

        // save game
        setGame(from,{
    answer: correctIndex + 1,
    country: correct.name.common
}, sock)

        await sock.sendMessage(from,{ text })

    }
}