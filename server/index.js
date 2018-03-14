var io;
var socket;
var gameRoom = 'room1';

//https://github.com/ericterpstra/anagrammatix/blob/master/agxgame.js
exports.init = function(hio, hsocket) {
    io = hio;
    socket = hsocket;
    socket.emit('connected', {msg: 'You have connected!'});

    socket.on('drawing', function(data){
		socket.broadcast.emit('drawing', data);
	});
    
    socket.on('clear', function(data) {
		socket.broadcast.emit('clear', data);
    });

    socket.on('ready', function(data) {
        socket.join(gameRoom);
    });

    socket.on('message', function(data) {
        socket.broadcast.emit('message', data);
    });

}