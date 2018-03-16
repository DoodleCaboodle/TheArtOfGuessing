var io;
var socket;
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
    socket = hsocket;    
    socket.emit('connected', {msg: 'You have connected!'});

    socket.on('drawing', function(data) {
		io.emit('drawing', data);
	});
    
    socket.on('clear', function(data) {
		io.emit('clear', data);
    });
    
    socket.on('undo', function(data) {
        io.emit('undo', data);
    });

    socket.on('redo', function(data) {
        iot.emit('redo', data);
    });

    socket.on('ready', function(data) {

        queueData[socket.id] = data;
        queueData[socket.id].wincount = 0;
        socket.join(queueRoom);
        console.log(io.sockets.adapter.rooms[queueRoom], io.sockets.adapter.rooms[gameRoom], socket.id);
        socket.emit('gameStatus', {gameStarted: gameStarted});
        checkQueue();
    });

    socket.on('message', function(data) {
        if (data.msg.toLowerCase().includes(currentWord.toLowerCase())) userWon(socket.id);
        socket.broadcast.emit('message', data);
    });
    
    socket.on('disconnect', function(data) {
//        if (socket.id == queue[currentDrawing]) endRound();
//        queue.splice(queue.indexOf(socket.id), 1);
//        gameQueue.splice(queue.indexOf(socket.id), 1);
//        delete queueData[socket.id];
//        //if (currentDrawing === socket.id) endRound();
        //socket.leave(queueRoom);
        //socket.leave(gameRoom);
        //socket.leave(doneRoom);
    });
    
    socket.on('word', function(data) {
        socket.broadcast.emit('word', data);
        currentWord = data.word;
    });
    
    socket.on('gameStatus', function(data) {
        socket.emit('gameStatus', {gameStarted: gameStarted});
    });
}

function checkQueue() {
    if (!gameStarted && !queueStarted && io.sockets.adapter.rooms[queueRoom].length > 1) {
        queueStarted = true;
        startQueueTimer();
    }
}

function startQueueTimer() {
    queueTimer = 20;
    queueInterval = setInterval(function(){startQueue();}, 1000);
}

function startQueue() {
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
    
    clearInterval(roundTimer);
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
    roundTimer -= 1;
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

function endGame() {
    clearInterval(roundInterval);
    clearInterval(queueInterval);
    //pickWinner
    gameStarted = false;
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
        }
        io.sockets.connected[winnerID].emit('gameWon', {name:gameWinner, wincount:winCount});
    }
    console.log("gamewon", gameWinner);
}
