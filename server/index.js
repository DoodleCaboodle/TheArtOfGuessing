var io;
var userModel = require("../user/user.js");
var roomId = 0;
var queueRoom = 'queue';
var queueData = {};
var lobbyData = {};
var queueStarted = false;
var roundTimer = 60;
var queueTimer = 45;
var queueInterval;
var roundIntervals = {};
var words = {};

exports.init = function(hio, hsocket) {
    io = hio;    
    hsocket.emit('connected', {msg: 'You have connected!'});
    
    hsocket.on('drawing', function(data) {
        if (queueData[hsocket.id]) {
            var gameRoom = queueData[hsocket.id].gameRoom;
            if (io.sockets.adapter.rooms[gameRoom]) {
                for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                    io.sockets.connected[key].emit('drawing', data);
                }
            }
        }
	});
    
    hsocket.on('clear', function(data) {
        if (queueData[hsocket.id]) {
            var gameRoom = queueData[hsocket.id].gameRoom;
            if (io.sockets.adapter.rooms[gameRoom]) {
                for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                    io.sockets.connected[key].emit('clear', data);
                }
            }
        }
    });
    
    hsocket.on('undo', function(data) {
        if (queueData[hsocket.id]) {
            var gameRoom = queueData[hsocket.id].gameRoom;
            if (io.sockets.adapter.rooms[gameRoom]) {
                for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                    io.sockets.connected[key].emit('undo', data);
                }
            }
        }
    });

    hsocket.on('redo', function(data) {
        if (queueData[hsocket.id]) {
            var gameRoom = queueData[hsocket.id].gameRoom;
            if (io.sockets.adapter.rooms[gameRoom]) {
                for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                    io.sockets.connected[key].emit('redo', data);
                }
            }
        }
    });

    hsocket.on('ready', function(data) {

        hsocket.join(queueRoom);
        //console.log(io.sockets.adapter.rooms[queueRoom], hsocket.id);
        hsocket.emit('gameStatus', {});
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {numInQueue: io.sockets.adapter.rooms[queueRoom].length});
        else
            io.emit('queueUpdated', {numInQueue: 0});
        queueData[hsocket.id] = data;
        queueData[hsocket.id].wincount = 0;
        queueData[hsocket.id].gameRoom = '';
        checkQueue();
    });
    
    hsocket.on('leaveQueue', function(data) {
        hsocket.leave(queueRoom);
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {numInQueue: io.sockets.adapter.rooms[queueRoom].length});
        else
            io.emit('queueUpdated', {numInQueue: 0});
    });
    
     hsocket.on('getQueueStatus', function(data) {
         if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {numInQueue: io.sockets.adapter.rooms[queueRoom].length});
         else
             io.emit('queueUpdated', {numInQueue: 0});
     });

    hsocket.on('message', function(data) {
        var gameRoom = queueData[hsocket.id].gameRoom;
        if (io.sockets.adapter.rooms[gameRoom]) {
            for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                io.sockets.connected[key].emit('message', data);
            }
        }
        checkMessage(hsocket.id, gameRoom, data.msg.toLowerCase());
    });
    
    hsocket.on('disconnect', function(data) {

        hsocket.leave(queueRoom);
        if (queueData[hsocket.id]) {
            hsocket.leave(queueData[hsocket.id].gameRoom);
            lobbyData[gameRoom].sockets.splice(lobbyData[gameRoom].sockets.indexOf(hsocket.id), 1);
        }
    });
    
    hsocket.on('word', function(data) {
        //hsocket.broadcast.emit('word', data);
        words[queueData[hsocket.id].gameRoom] = data.word;

    });
    
    hsocket.on('gameStatus', function(data) {
        hsocket.emit('gameStatus', {});
    });
}

function checkMessage(id, gameRoom, msg) {
    if (words[gameRoom] && msg.includes(words[gameRoom].toLowerCase())) userWon(id, gameRoom);
}

function checkQueue() {
    console.log("checkign queue");
    if (!queueStarted && io.sockets.adapter.rooms[queueRoom].length > 1) {
        queueStarted = true;
        startQueue();
    }
}

function startQueue() {
    console.log("queue started");
    queueTimer = 45;
    queueInterval = setInterval(function(){startQueueTimer();}, 1000);
}

function startQueueTimer() {
    if (io.sockets.adapter.rooms[queueRoom].length < 2) {
        for (var key in io.sockets.adapter.rooms[queueRoom].sockets) {
            io.sockets.connected[key].emit('stopQueueTimer', {});
            io.sockets.connected[key].emit('queueUpdated', {numInQueue: io.sockets.adapter.rooms[queueRoom].length});
            queueStarted = false;
        }
        clearInterval(queueInterval);
        return;
    }
    queueTimer -= 1;
    console.log(queueTimer);
    for (var key in io.sockets.adapter.rooms[queueRoom].sockets) {
        io.sockets.connected[key].emit('queueTimer', {time:queueTimer});
    }
    if (queueTimer <= 0) {
        clearInterval(queueInterval);
        queueTimer = 45;
        console.log("queue over, starting game");
        startGame();
    }
}

function startGame(privateQueue=null) {
    var gameRoom;
    var playerList = [];
    if (privateQueue == null) {;
        gameRoom = "gameRoom" + roomId;
        lobbyData[gameRoom] = {sockets:[], matchNum:2, i:0};
        if (io.sockets.adapter.rooms[queueRoom]) {
            for (var key in io.sockets.adapter.rooms[queueRoom].sockets) {
                io.sockets.connected[key].leave(queueRoom);
                io.sockets.connected[key].join(gameRoom);
                playerList.push({
                    name: queueData[key].name,
                    wincount: 0,
                    email: queueData[key].email
                });
                queueData[key].gameRoom = gameRoom;
                lobbyData[gameRoom].sockets.push(key);
            }
        }
        if (io.sockets.adapter.rooms[gameRoom]) {
            for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                io.sockets.connected[key].emit('startGame', {playerList:playerList});
            }
        }
        roomId ++;
    }
    if (io.sockets.adapter.rooms[queueRoom])
        io.emit('queueUpdated', {
            numInQueue: io.sockets.adapter.rooms[queueRoom].length
        });
    else
        io.emit('queueUpdated', {
            numInQueue: 0
        });
    console.log(io.sockets.adapter.rooms[queueRoom], io.sockets.adapter.rooms[gameRoom]);
    queueStarted = false;
    lobbyData[gameRoom].matchNum--;
    roundTimer = 60;
    startNextRound(gameRoom);
}

function endRound(gameRoom) {
    
    clearInterval(roundIntervals[gameRoom]);
    // update stats
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('clear', {});
            var word = {};
            word[words[gameRoom]] = {guessed:0, drawn:0};
            userModel.updateStats(queueData[key].email, 0, 1, 0, 0, word);
        }
    }
    delete words[gameRoom];
    roundIntervals[gameRoom + 'Timer'] = 60;
    console.log("round end", gameRoom);
    console.log(lobbyData[gameRoom].matchNum);
    if (lobbyData[gameRoom].i >= lobbyData[gameRoom].sockets.length) {
        if (lobbyData[gameRoom].matchNum <= 0) endGame(gameRoom);
        else {
            lobbyData[gameRoom].matchNum--;
            lobbyData[gameRoom].i = 0;
            startNextRound(gameRoom);
        }
    }
    else {
        startNextRound(gameRoom);
    }
}

function startNextRound(gameRoom) {
    if (io.sockets.adapter.rooms[gameRoom].length == 0) {
        endGame();
        return;
    }
    var drawing = lobbyData[gameRoom].sockets[lobbyData[gameRoom].i];
    lobbyData[gameRoom].i++;
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('systemMessage', {
                msg: queueData[drawing].name + " will draw next.",
                endGame: false,
                color: '#33aa33'
            });
            if (key != drawing) io.sockets.connected[key].emit('noDraw', {});
        }
    }
    io.sockets.connected[drawing].emit("draw", {});
    // round robin
    roundIntervals[gameRoom+'Timer'] = 60;
    roundIntervals[gameRoom] = setInterval(function(){startRoundTimer(gameRoom);}, 1000);
}

function startRoundTimer(gameRoom) {
    var gameRoomLength = 0;
    if (io.sockets.adapter.rooms[gameRoom]) gameRoomLength = io.sockets.adapter.rooms[gameRoom].length;     if ((gameRoomLength) < 2) {
        io.sockets.connected[Object.keys(io.sockets.adapter.rooms[gameRoom].sockets)[0]].emit('systemMessage', {msg:"Ending game, not enough players in game.", endGame:true});
        endGame(gameRoom, true);
    }
    if (words[gameRoom]) roundIntervals[gameRoom + 'Timer'] -= 1;
    console.log(roundIntervals[gameRoom + 'Timer']);
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('roundTimer', {time: roundIntervals[gameRoom+'Timer']});
        }
    }
    if (roundIntervals[gameRoom + 'Timer'] <= 0) {
        endRound(gameRoom);
    }
}

function userWon(id, gameRoom) {
    queueData[id].wincount++;
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('won', {
                name: queueData[id].name,
                word: words[gameRoom],
                email: queueData[id].email,
                wincount: queueData[id].wincount
            });
            io.sockets.connected[key].emit('systemMessage', {
                msg: queueData[id].name + " won the round.",
                endGame: false,
                color: '#3333aa'
            });
        }
    }
    endRound(gameRoom);
}

function endGame(gameRoom, immediate=false) {
    clearInterval(roundIntervals[gameRoom]);
    //pickWinner
    if (!immediate) {
        var gameWinner = '';
        var winnerEmail = '';
        var winnerID;
        var winCount = 0;
        for (var key in queueData) {
            if (queueData[key].wincount >= winCount) {
                gameWinner = queueData[key].name; 
                winnerID = key;
                winCount = queueData[key].wincount;
                winnerEmail = queueData[winnerID].email;
            }
            userModel.updateStats(queueData[key].email, queueData[key].wincount, 0, 0, 1, {});
        }
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit("gameWinner", {
            name: gameWinner
            });
            io.sockets.connected[key].leave(gameRoom);
            delete lobbyData[gameRoom];
            delete queueData[key];
        }
        io.sockets.connected[winnerID].emit('gameWon', {name:gameWinner, wincount:winCount});
        userModel.updateStats(winnerEmail, 0, 0, 1, 0, {});
        console.log("gamewon", gameWinner);
    }
    if (io.sockets.adapter.rooms[queueRoom]) {
        for (var key in io.sockets.adapter.rooms[queueRoom].sockets) {
            io.sockets.connected[key].emit('gameStatus', {});
        }
    }
}
