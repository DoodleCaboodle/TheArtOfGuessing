var io;
var socket;

//https://github.com/ericterpstra/anagrammatix/blob/master/agxgame.js
exports.init = function(hio, hsocket) {
    io = hio;
    socket = hsocket;
    socket.emit('connected', {msg: 'You have connected!'});
    
}