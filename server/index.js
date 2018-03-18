var io;
var userModel = require("../user/user.js");
var gameRoom = 'game';
var doneRoom = 'done';
var queueRoom = 'queue';
var queueData = {};
var queueStarted = false;
var gameStarted = false;
var drawing = 0;
var currentWord = '';
var roundTimer = 60;
var queueTimer = 45;
var queueInterval;
var roundInterval;

exports.init = function(hio, hsocket) {
    io = hio;    
    hsocket.emit('connected', {msg: 'You have connected!'});
    
    hsocket.on('drawing', function(data) {
		io.emit('drawing', data);
	});
    
    hsocket.on('clear', function(data) {
		io.emit('clear', data);
    });
    
    hsocket.on('undo', function(data) {
        io.emit('undo', data);
    });

    hsocket.on('redo', function(data) {
        io.emit('redo', data);
    });

    hsocket.on('ready', function(data) {

        queueData[hsocket.id] = data;
        queueData[hsocket.id].wincount = 0;
        userModel.getStats(queueData[hsocket.id].email, function(err, result){
            if (!err && result.length > 0) {
                queueData[hsocket.id].stats = result[0];
            }
        })
        hsocket.join(queueRoom);
        console.log(io.sockets.adapter.rooms[queueRoom], io.sockets.adapter.rooms[gameRoom], hsocket.id);
        hsocket.emit('gameStatus', {gameStarted: gameStarted});
        checkQueue();
    });

    hsocket.on('message', function(data) {
        if (currentWord !== '' && data.msg.toLowerCase().includes(currentWord.toLowerCase())) userWon(hsocket.id);
        hsocket.broadcast.emit('message', data);
    });
    
    hsocket.on('disconnect', function(data) {
//        if (socket.id == queue[currentDrawing]) endRound();
//        queue.splice(queue.indexOf(socket.id), 1);
//        gameQueue.splice(queue.indexOf(socket.id), 1);
//        delete queueData[socket.id];
//        //if (currentDrawing === socket.id) endRound();
        hsocket.leave(queueRoom);
        hsocket.leave(gameRoom);
        hsocket.leave(doneRoom);
    });
    
    hsocket.on('word', function(data) {
        hsocket.broadcast.emit('word', data);
        currentWord = data.word;
    });
    
    hsocket.on('gameStatus', function(data) {
        hsocket.emit('gameStatus', {gameStarted: gameStarted});
    });
}

function checkQueue() {
    console.log("checkign queue");
    if (!gameStarted && !queueStarted && io.sockets.adapter.rooms[queueRoom].length > 1) {
        queueStarted = true;
        startQueue();
    }
}

function startQueue() {
    console.log("queue started");
    queueTimer = 20;
    queueInterval = setInterval(function(){startQueueTimer();}, 1000);
}

function startQueueTimer() {
    //if (io.sockets.adapter.rooms[queueRoom].length < 2) endGame(true);
    queueTimer -= 1;
    console.log(queueTimer);
    for (var key in io.sockets.adapter.rooms[queueRoom].sockets) {
        io.sockets.connected[key].emit('queueTimer', {time:queueTimer});
    }
    if (queueTimer <= 0) {
        clearInterval(queueInterval);
        queueTimer = 20;
        console.log("queue over, starting game");
        startGame();
    }
}

function startGame() {
    for (var key in io.sockets.adapter.rooms[queueRoom].sockets) {
        io.sockets.connected[key].leave(queueRoom);
        io.sockets.connected[key].join(gameRoom);
    }
    for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
        io.sockets.connected[key].emit('startGame', {});
    }
    console.log(io.sockets.adapter.rooms[queueRoom], io.sockets.adapter.rooms[gameRoom]);
    queueStarted = false;
    gameStarted = true;
    roundTimer = 60;
    startNextRound();
}

function endRound() {
    
    clearInterval(roundInterval);
    currentWord = '';
    roundTimer = 60;
    console.log("round end");
    io.emit('clear', {});
    if (!io.sockets.adapter.rooms[gameRoom]) {
        endGame();
    }
    else {
        startNextRound();
    }
}

function startNextRound() {
    if (io.sockets.adapter.rooms[gameRoom].length == 0) {
        endGame();
        return;
    }
    drawing = Object.keys(io.sockets.adapter.rooms[gameRoom].sockets)[0];
    io.sockets.connected[drawing].emit('draw', {});
    io.sockets.connected[drawing].broadcast.emit('noDraw', {});
    io.sockets.connected[drawing].leave(gameRoom);
    io.sockets.connected[drawing].join(doneRoom);
    // round robin
    roundTimer = 60;
    roundInterval = setInterval(function(){startRoundTimer();}, 1000);
}

function startRoundTimer() {
    //if (io.sockets.adapter.rooms[gameRoom].length < 2) endGame(true);
    if (currentWord !== '') roundTimer -= 1;
    console.log(roundTimer);
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('roundTimer', {time: roundTimer});
        }
    }
    if (io.sockets.adapter.rooms[doneRoom]) {
        for (var key in io.sockets.adapter.rooms[doneRoom].sockets) {
            io.sockets.connected[key].emit('roundTimer', {time: roundTimer});
        }
    }
    if (roundTimer <= 0) {
        endRound();
    }
}

function userWon(id) {
    io.emit('won', {name:queueData[id].name, word:currentWord});
    queueData[id].wincount++;
    endRound();
}

function endGame(immediate=false) {
    clearInterval(roundInterval);
    clearInterval(queueInterval);
    //pickWinner
    gameStarted = false;
    if (!immediate) {
        var gameWinner = '';
        var winnerID;
        var winCount = 0;
        if (!io.sockets.adapter.rooms[gameRoom] && io.sockets.adapter.rooms[doneRoom]) {
            for (var key in queueData) {
                if (queueData[key].wincount >= winCount) {
                    gameWinner = queueData[key].name; 
                    winnerID = key;
                    winCount = queueData[key].wincount;
                }
            }
            for (var key in io.sockets.adapter.rooms[doneRoom].sockets) {
                io.sockets.connected[key].emit('gameWinner', {name:gameWinner});
                io.sockets.connected[key].leave(doneRoom);
            }
            io.sockets.connected[winnerID].emit('gameWon', {name:gameWinner, wincount:winCount});
        }
        console.log("gamewon", gameWinner);
    }
}
