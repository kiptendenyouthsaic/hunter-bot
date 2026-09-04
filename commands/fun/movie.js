const movie = require("../../utils/movieGame")

module.exports = {

name: "movie",
description: "Guess the movie emoji game",
category: "fun",
usage: ".movie",

async execute(sock, msg){

const from = msg.key.remoteJid

movie.startGame(sock, from)

}

}