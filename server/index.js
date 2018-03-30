var io;
var userModel = require("../user/user.js");
var roomId = 0;
var queueRoom = 'queue';
var queueData = {};
var lobbyData = {};
var privateLobbies = {};
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
        clearSocket(hsocket.id, {userData:data});
        hsocket.join(queueRoom);
        //console.log(io.sockets.adapter.rooms[queueRoom], hsocket.id);
        hsocket.emit('gameStatus', {});
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {numInQueue: io.sockets.adapter.rooms[queueRoom].length});
        else
            io.emit('queueUpdated', {numInQueue: 0});
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
            if (lobbyData[queueData[hsocket.id].gameRoom]) lobbyData[queueData[hsocket.id].gameRoom].sockets.splice(lobbyData[queueData[hsocket.id].gameRoom].sockets.indexOf(hsocket.id), 1);
            leaveLobby(hsocket.id);
            updateGameRoom(queueData[hsocket.id].gameRoom, queueData[hsocket.id].name);
        }
    });
    
    hsocket.on('word', function(data) {
        //hsocket.broadcast.emit('word', data);
        words[queueData[hsocket.id].gameRoom] = data.word;

    });
    
    hsocket.on('gameStatus', function(data) {
        hsocket.emit('gameStatus', {});
    });

    hsocket.on('createLobby', function(data) {
        if (privateLobbies[data.name]) {
            hsocket.emit("notification", {
                 msg: "Lobby already exists, please choose a different name."
            });
            hsocket.emit("createLobby", {});
        }
        else if(data.name.length <= 0 || data.name === '') {
            hsocket.emit("notification", {
                 msg: "Invalid lobby parameters, name cannot be empty."
            });
            hsocket.emit("createLobby", {});
        }
        else {
            clearSocket(hsocket.id, data);
            privateLobbies[data.name] = {name: data.name, pass: data.pass, numRounds: data.numRounds, owner:hsocket.id, users:[hsocket.id]};
            queueData[hsocket.id].pl = data.name;
            var userList = [];
            for (var i = 0; i < privateLobbies[data.name].users.length; i++) {
                userList.push(queueData[privateLobbies[data.name].users[i]].name);
            }
            hsocket.emit("createLobby", {});
            hsocket.emit("updatePl", { users: userList });
            hsocket.emit("notification", {
              msg:
                "Successfully created lobby."
            });
        }
    });

    hsocket.on('leaveLobby', function(data) {
        if (leaveLobby(hsocket.id)) {
            hsocket.emit('leaveLobby', {});
            hsocket.emit('notification', {msg:'Successfully left private lobby.'});
        }
    });

    hsocket.on('startLobby', function(data) {
        if (privateLobbies[data.name] && privateLobbies[data.name].owner == hsocket.id) {
            if (privateLobbies[data.name].users.length > 1) {
                startGame(data.name);
            }
            else hsocket.emit('notification', {msg:'Not enough people to start the game.'});
            hsocket.emit('startLobby', {});
        }
        else hsocket.emit('notification', {msg:'You are not the owner of the lobby.'});
    });

    hsocket.on('joinLobby', function(data) {
        if (privateLobbies[data.name]) {
            if (privateLobbies[data.name].pass == data.pass) {
                clearSocket(hsocket.id, data);
                privateLobbies[data.name].users.push(hsocket.id);
                queueData[hsocket.id].pl = data.name;
                var userList = [];
                for (var i = 0; i < privateLobbies[data.name].users.length; i++) {
                    userList.push(queueData[privateLobbies[data.name].users[i]].name);
                }
                privateLobbies[data.name].users.forEach(function(hid) {
                    io.sockets.connected[hid].emit("updatePl", {users:userList});
                });
                hsocket.emit("joinedLobby", {
                  name: data.name,
                  pass: data.pass,
                  valid: true
                });
                hsocket.emit("notification", {
                  msg: "Successfully joined lobby."
                });
            }
            else {
                hsocket.emit('notification', {msg:'Invalid password.'});
                hsocket.emit("joinedLobby", {
                  name: "",
                  pass: "",
                  valid: false
                });
            }
        }
        else {
            hsocket.emit('notification', {msg:'Invalid lobby.'});
            hsocket.emit("joinedLobby", {
              name: '',
              pass: '',
              valid:false
            });
        }
    });

    hsocket.on('disbandPL', function(data) {
        disbandPL(hsocket.id, data);
    });
}

function disbandPL(id, data) {
    if (privateLobbies[data.name]) {
        for (var i = 1; i < privateLobbies[data.name].users.length; i++) {
            io.sockets.connected[privateLobbies[data.name].users[i]].emit("disbandPL", {});
            io.sockets.connected[privateLobbies[data.name].users[i]].emit(
                "notification",
                { msg: "Private lobby disbanded." }
            );
        }
        delete privateLobbies[data.name];
        io.sockets.connected[id].emit("disbandPL", {});
        io.sockets.connected[id].emit("notification", { msg: "Disbanded successfully." });
        queueData[id].pl = '';
    }
}

/**
 * Removes a given user, @name, from a given game room, @gameRoom, and informs all other users in the game room of this change
 * 
 * @param {string} gameRoom 
 * @param {string} name 
 */
function updateGameRoom(gameRoom, name) {
    if (lobbyData[gameRoom]) {
        lobbyData[gameRoom].playerList.splice(lobbyData[gameRoom].playerList.map(function(e) { return e.name; }).indexOf(name), 1);
        lobbyData[gameRoom].sockets.forEach(function(hid) {
             io.sockets.connected[hid].emit('updateUserList', {playerList:lobbyData[gameRoom].playerList});

        });
    }
}

function clearSocket(id, data) {
    
    if (queueData[id]) {
        io.sockets.connected[id].leave(queueRoom);
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {numInQueue: io.sockets.adapter.rooms[queueRoom].length});
        else
            io.emit('queueUpdated', {numInQueue: 0});
        if (queueData[id].pl && queueData[id].pl !== '') {
            if (privateLobbies[queueData[id].pl].owner == id) disbandPL(id, {name:queueData[id].pl});
            else leaveLobby(id, data);
        }
    }
    else {
        queueData[id] = data.userData;
        queueData[id].wincount = 0;
        queueData[id].gameRoom = '';
    }

}

function leaveLobby (id) {

    if (privateLobbies[queueData[id].pl] && privateLobbies[queueData[id].pl].users.indexOf(id) > -1) {
        privateLobbies[queueData[id].pl].users.splice(privateLobbies[queueData[id].pl].users.indexOf(id), 1);
        var userList = [];
        for (var i = 0; i < privateLobbies[queueData[id].pl].users.length; i++) {
            userList.push(queueData[privateLobbies[queueData[id].pl].users[i]].name);
        }
        privateLobbies[queueData[id].pl].users.forEach(function(hid) {
            io.sockets.connected[hid].emit("updatePl", { users: userList });
        });
        return true;
    } else return false;

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
        lobbyData[gameRoom].playerList = playerList;
        if (io.sockets.adapter.rooms[gameRoom]) {
            for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                io.sockets.connected[key].emit('startGame', {playerList:playerList});
            }
        }
        roomId ++;
    }
    else {
        gameRoom = privateLobbies[privateQueue].name;
        lobbyData[gameRoom] = { sockets: privateLobbies[gameRoom].users, matchNum: privateLobbies[gameRoom].numRounds, i: 0 };
        for (var i = 0; i < lobbyData[gameRoom].sockets.length; i++) {
            console.log("loop", i, lobbyData[gameRoom].sockets.length);
            var key = lobbyData[gameRoom].sockets[i];
            io.sockets.connected[key].leave(queueRoom);
            io.sockets.connected[key].join(gameRoom);
            playerList.push({
                name: queueData[key].name,
                wincount: 0,
                email: queueData[key].email
            });
            queueData[key].gameRoom = gameRoom;
        }
        lobbyData[gameRoom].playerList = playerList;
        if (io.sockets.adapter.rooms[gameRoom]) {
            for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
                io.sockets.connected[key].emit('startGame', {playerList:playerList});
            }
        }
        delete privateLobbies[gameRoom];
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
