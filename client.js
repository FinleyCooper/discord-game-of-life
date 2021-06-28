require("dotenv").config();
const boards = require("./boards");
const Discord = require("discord.js");
const client = new Discord.Client();

const MAX_GENS = 100
const genDelay = t => new Promise(resolve => setTimeout(resolve, t))

let runningGames = []

client.on("ready", () => {
    console.log(`${client.user.tag} connected to Discord`);
})

client.on("message", async message => {
    if (message.content.toLowerCase() === "!gameoflife") {
        let channel = client.channels.cache.get(message.channel.id);
        let messages = [];
        messages.push(await channel.send("Creating a game with random noise..."));

        setTimeout(async () => {
            board = createRandomBoard(boards.plain);
            messages.push(await channel.send(`Board Created! Max Generation of ${MAX_GENS}\nUse **!end** to stop the game or **!freeze** to stop evolution`))
            let discordBoard = await channel.send(arrayToDisplay(board) + "Generation: **0**");
            messages.push(discordBoard)
            let gen = 0;
            let running = true;
            runningGames.push({
                board: discordBoard,
                producer: message.author,
                messages: messages
            })

            while (isRunning(discordBoard) && gen <= MAX_GENS-1) {
                await genDelay(1000);
                gen++
                if (!isRunning(discordBoard)) break;
                board = tickBoard(board);
                await discordBoard.edit(arrayToDisplay(board) + `Generation: **${gen}**`).catch()
            }
        }, 500)
    }

    else if (message.content.toLowerCase() === "!end") {
        for (let i=0; i<runningGames.length; i++) {
            if (runningGames[i].producer.id === message.author.id && message.channel.id === runningGames[i].board.channel.id) {
                runningGames[i].messages.forEach(async msg => await msg.delete().catch());
                runningGames[i].board.channel.send("Life **Eradicated**. Thanks for playing!");
                runningGames.splice(i, 1);
            }
        }
    }
    else if (message.content.toLowerCase() === "!freeze") {
        for (let i=0; i<runningGames.length; i++) {
            if (runningGames[i].producer.id === message.author.id && message.channel.id === runningGames[i].board.channel.id) {
                runningGames[i].board.channel.send("Life **Frozen**. Now you can admire it!");
                runningGames.splice(i, 1);
            }
        }
    }
})

function isRunning(board) {
    for (let i=0; i<runningGames.length; i++) {
        if (runningGames[i].board.id === board.id) return true;
    }
    return false;
}

function createRandomBoard(startingBoard) {
    return board = startingBoard.map(cell => cell = Math.round(Math.random()));
}

function arrayToDisplay(boardArray) {
    let resolution = Math.trunc(boardArray.length ** 0.5)
    for (let i=0; i<resolution; i++) boardArray.splice((i+1)*resolution+i, 0, "\n"); // O(sqrt(n)) for every row of cells a \n is inserted at the end
    return finalBoard = boardArray.map(cell => { if (cell === "\n") {return "\n"} else if (cell) return "⬜";else return "⬛";}).join("") // formates to the 0, 1, and \n for a user to be able to see
}

function tickBoard(board) {
    board = board.filter(cell => cell === 0 || cell === 1)
    let resolution = Math.trunc(board.length ** 0.5)
    let B = []
    for (let i=0; i<resolution; i++) B.push(board.slice(i*resolution, (i+1) * resolution));

    let m = B.length, n = B[0].length
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++) {
            let c = -B[i][j]
            for (let k = -1; k < 2; k++)
                for (let l = -1; l < 2; l++)
                    if (B[i+k]?.[j+l] % 2) c++
            if (c > 3 || c < 2) B[i][j] *= 3
            else if (c === 3 && !B[i][j]) B[i][j] = 4
        }
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            B[i][j] %= 3
    return [].concat(...B);
};

client.login(process.env.BOT_TOKEN)