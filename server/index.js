var io;
var socket;
var gameRoom = 'room1';
var clients = [];
var queue = [];
var queueData = {};
var gameStarted = false;
var currentDrawing;
var roundTimer = 60;
var queueTimer = 45;
var queueInterval;
var roundInterval;

//https://github.com/ericterpstra/anagrammatix/blob/master/agxgame.js
exports.init = function(hio, hsocket) {
    io = hio;
    socket = hsocket;
    clients.push(socket.id);
    console.log(clients, queue, 'connect');
    
    socket.emit('connected', {msg: 'You have connected!'});

    socket.on('drawing', function(data){
		socket.broadcast.emit('drawing', data);
	});
    
    socket.on('clear', function(data) {
		socket.broadcast.emit('clear', data);
    });

    socket.on('ready', function(data) {
        queue.push(socket.id);
        queueData[socket.id] = data;
        socket.join(gameRoom);
        if (queue.length > 1) startQueueTimer();
    });

    socket.on('message', function(data) {
        socket.broadcast.emit('message', data);
    });
    
    socket.on('disconnect', function(data) {
        clients.splice(clients.indexOf(socket.id), 1);
        queue.splice(queue.indexOf(socket.id), 1);
        delete queueData[socket.id];
        if (currentDrawing === socket.id) endRound();
        console.log(clients, queue, 'disconnect');
    });
}

function startQueueTimer() {
    queueTimer = 45;
    queueInterval = setInterval(startQueue(), 1000);
}

function startQueue() {
    queueTimer -= 1;
    if (queueTimer <= 0) {
        clearInterval(queueInterval);
        queueTimer = 60;
        console.log("queue over, starting game");
        startGame();
    }
}

function startGame() {
    startNextRound();
}

function startNextRound() {
    // round robin 
}