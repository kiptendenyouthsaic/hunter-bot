const movie = require("../../utils/movieQuizSystem")

module.exports = {

name:"movielb",
description:"Movie quiz leaderboard",
category:"fun",

async execute(sock,msg){

const from = msg.key.remoteJid

movie.leaderboard(sock,from)

}

}