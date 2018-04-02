// constants
const TIMER_ROUND = 60;
const TIMER_QUEUE = 45;

var io;
var userModel = require("../user/user.js");
var roomId = 0;
var queueRoom = 'queue';
var queueData = {};
var lobbyData = {};
var privateLobbies = {};
var queueStarted = false;
var queueTimer = TIMER_QUEUE;
var queueInterval;
var roundIntervals = {};
var words = {};

// initialize a new socket.
exports.init = function(hio, hsocket) {
    io = hio;
    hsocket.emit('connected', {
        msg: 'You have connected!'
    });

    // handle all messages from clients

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
        clearSocket(hsocket.id, {
            userData: data
        }, true);
        hsocket.join(queueRoom);
        hsocket.emit('gameStatus', {});
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {
                numInQueue: io.sockets.adapter.rooms[queueRoom].length
            });
        else
            io.emit('queueUpdated', {
                numInQueue: 0
            });
        checkQueue();
    });

    hsocket.on('leaveQueue', function(data) {
        hsocket.leave(queueRoom);
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {
                numInQueue: io.sockets.adapter.rooms[queueRoom].length
            });
        else
            io.emit('queueUpdated', {
                numInQueue: 0
            });
    });

    hsocket.on('getQueueStatus', function(data) {
        if (io.sockets.adapter.rooms[queueRoom])
            io.emit('queueUpdated', {
                numInQueue: io.sockets.adapter.rooms[queueRoom].length
            });
        else
            io.emit('queueUpdated', {
                numInQueue: 0
            });
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
            updateGameRoom(hsocket.id, queueData[hsocket.id].gameRoom, queueData[hsocket.id].name);
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
        } else if (data.name.length <= 0 || data.name === '') {
            hsocket.emit("notification", {
                msg: "Invalid lobby parameters, name cannot be empty."
            });
            hsocket.emit("createLobby", {});
        } else {
            clearSocket(hsocket.id, data);
            privateLobbies[data.name] = {
                name: data.name,
                pass: data.pass,
                numRounds: data.numRounds,
                owner: hsocket.id,
                users: [hsocket.id]
            };
            queueData[hsocket.id].pl = data.name;
            var userList = [];
            for (var i = 0; i < privateLobbies[data.name].users.length; i++) {
                userList.push(queueData[privateLobbies[data.name].users[i]].name);
            }
            hsocket.emit("createLobby", {});
            hsocket.emit("updatePl", {
                users: userList
            });
            hsocket.emit("notification", {
                msg: "Successfully created lobby."
            });
        }
    });

    hsocket.on('leaveLobby', function(data) {
        if (leaveLobby(hsocket.id)) {
            hsocket.emit('leaveLobby', {});
            hsocket.emit('notification', {
                msg: 'Successfully left private lobby.'
            });
        }
    });

    hsocket.on('startLobby', function(data) {
        if (privateLobbies[data.name] && privateLobbies[data.name].owner == hsocket.id) {
            if (privateLobbies[data.name].users.length > 1) {
                startGame(data.name);
            } else hsocket.emit('notification', {
                msg: 'Not enough people to start the game.'
            });
            hsocket.emit('startLobby', {});
        } else hsocket.emit('notification', {
            msg: 'You are not the owner of the lobby.'
        });
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
                    io.sockets.connected[hid].emit("updatePl", {
                        users: userList
                    });
                });
                hsocket.emit("joinedLobby", {
                    name: data.name,
                    pass: data.pass,
                    valid: true
                });
                hsocket.emit("notification", {
                    msg: "Successfully joined lobby."
                });
            } else {
                hsocket.emit('notification', {
                    msg: 'Invalid password.'
                });
                hsocket.emit("joinedLobby", {
                    name: "",
                    pass: "",
                    valid: false
                });
            }
        } else {
            hsocket.emit('notification', {
                msg: 'Invalid lobby.'
            });
            hsocket.emit("joinedLobby", {
                name: '',
                pass: '',
                valid: false
            });
        }
    });

    hsocket.on('disbandPL', function(data) {
        disbandPL(hsocket.id, data);
    });
};

/**
 * Disband a private lobby and inform all its users
 *
 * @param {number} id
 * @param {object} data data must contain the name property which represents the name of the lobby
 */
function disbandPL(id, data) {
    if (privateLobbies[data.name]) {
        for (var i = 1; i < privateLobbies[data.name].users.length; i++) {
            io.sockets.connected[privateLobbies[data.name].users[i]].emit("disbandPL", {});
            io.sockets.connected[privateLobbies[data.name].users[i]].emit(
                "notification", {
                    msg: "Private lobby disbanded."
                }
            );
        }
        delete privateLobbies[data.name];
        io.sockets.connected[id].emit("disbandPL", {});
        io.sockets.connected[id].emit("notification", {
            msg: "Disbanded successfully."
        });
        queueData[id].pl = '';
    }
}

/**
 * Removes a given user, @name, from a given game room, @gameRoom, 
 * and informs all other users in the game room of this change
 *
 * @param {string} gameRoom
 * @param {string} name
 */
function updateGameRoom(id, gameRoom, name) {
    if (lobbyData[gameRoom]) {
        lobbyData[gameRoom].playerList.splice(lobbyData[gameRoom].playerList.map(function(e) {
            return e.name;
        }).indexOf(name), 1);
        lobbyData[gameRoom].sockets.forEach(function(hid) {
            io.sockets.connected[hid].emit('updateUserList', {
                playerList: lobbyData[gameRoom].playerList
            });

        });
        if (lobbyData[gameRoom].drawing == id) {
            endRound(gameRoom);
        }
    }
}

/**
 * Reset a socket, remove from any queues / lobbies and reset their data.
 *
 * @param {number} id
 * @param {object} data must contain the property userdata which is as follows
 *                          {name: <name>, email:<email>}
 * @param {boolean} notInQueu default value false, set to true if queue for public queue
 */
function clearSocket(id, data, notInQueue = false) {

    if (queueData[id]) {
        if (!notInQueue) {
            io.sockets.connected[id].leave(queueRoom);
            if (io.sockets.adapter.rooms[queueRoom])
                io.emit('queueUpdated', {
                    numInQueue: io.sockets.adapter.rooms[queueRoom].length
                });
            else
                io.emit('queueUpdated', {
                    numInQueue: 0
                });
        }
        if (queueData[id].pl && queueData[id].pl !== '') {
            if (privateLobbies[queueData[id].pl].owner == id) disbandPL(id, {
                name: queueData[id].pl
            });
            else leaveLobby(id, data);
        }
    } else {
        queueData[id] = data.userData;
        queueData[id].wincount = 0;
        queueData[id].gameRoom = '';
    }

}

/**
 * Removes a socket its connected private lobby.
 *
 * @param {number} id
 */
function leaveLobby(id) {

    if (privateLobbies[queueData[id].pl] && privateLobbies[queueData[id].pl].users.indexOf(id) > -1) {
        privateLobbies[queueData[id].pl].users.splice(privateLobbies[queueData[id].pl].users.indexOf(id), 1);
        var userList = [];
        for (var i = 0; i < privateLobbies[queueData[id].pl].users.length; i++) {
            userList.push(queueData[privateLobbies[queueData[id].pl].users[i]].name);
        }
        privateLobbies[queueData[id].pl].users.forEach(function(hid) {
            io.sockets.connected[hid].emit("updatePl", {
                users: userList
            });
        });
        return true;
    } 
    else return false;

}

/**
 * Test if the msg contains the correct word, if so end round. Relay message to all users in the room
 *
 * @param {number} id
 * @param {string} gameRoom
 * @param {string} msg
 */
function checkMessage(id, gameRoom, msg) {
    if (words[gameRoom] && msg.includes(words[gameRoom].toLowerCase())) userWon(id, gameRoom);
}

/**
 * Check if the queue is ready to start, if so start.
 */
function checkQueue() {
    if (!queueStarted && io.sockets.adapter.rooms[queueRoom].length > 1) {
        queueStarted = true;
        startQueue();
    }
}

/**
 * Start the queue.
 */
function startQueue() {
    queueTimer = TIMER_QUEUE;
    queueInterval = setInterval(function() {
        startQueueTimer();
    }, 1000);
}

/**
 * Start the queue timer, and inform all users of queue status (time/num of users)
 */
function startQueueTimer() {
	var key;
    if (io.sockets.adapter.rooms[queueRoom].length < 2) {
        for (key in io.sockets.adapter.rooms[queueRoom].sockets) {
            io.sockets.connected[key].emit('stopQueueTimer', {});
            io.sockets.connected[key].emit('queueUpdated', {
                numInQueue: io.sockets.adapter.rooms[queueRoom].length
            });
            queueStarted = false;
        }
        clearInterval(queueInterval);
        return;
    }
    queueTimer -= 1;
    for (key in io.sockets.adapter.rooms[queueRoom].sockets) {
        io.sockets.connected[key].emit('queueTimer', {
            time: queueTimer
        });
    }
    if (queueTimer <= 0) {
        clearInterval(queueInterval);
        queueTimer = TIMER_QUEUE;
        startGame();
    }
}

/**
 * Initialize a new game (public / private) and inform all users in the lobby of the game.
 *
 * @param {string} privateQueue the name of the private lobby
 */
function startGame(privateQueue = null) {
    var gameRoom;
    var playerList = [];
    var key;
    if (privateQueue == null) {
        gameRoom = "gameRoom" + roomId;
        lobbyData[gameRoom] = {
            sockets: [],
            matchNum: 2,
            i: 0,
            drawing: null
        };
        if (io.sockets.adapter.rooms[queueRoom]) {
            for (key in io.sockets.adapter.rooms[queueRoom].sockets) {
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
            for (key in io.sockets.adapter.rooms[gameRoom].sockets) {
                io.sockets.connected[key].emit('startGame', {
                    playerList: playerList
                });

            }
        }
        roomId++;
    } else {
        gameRoom = privateLobbies[privateQueue].name;
        lobbyData[gameRoom] = {
            sockets: privateLobbies[gameRoom].users,
            matchNum: privateLobbies[gameRoom].numRounds,
            i: 0
        };
        for (var i = 0; i < lobbyData[gameRoom].sockets.length; i++) {
            key = lobbyData[gameRoom].sockets[i];
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
            for (key in io.sockets.adapter.rooms[gameRoom].sockets) {
                io.sockets.connected[key].emit('startGame', {
                    playerList: playerList
                });
            }
        }
        delete privateLobbies[gameRoom];
    }
    // if any users missed the start of the game inform them that a game hs already begun
    // update their connected user count.
    if (io.sockets.adapter.rooms[queueRoom])
        io.emit('queueUpdated', {
            numInQueue: io.sockets.adapter.rooms[queueRoom].length
        });
    else
        io.emit('queueUpdated', {
            numInQueue: 0
        });
    queueStarted = false;
    lobbyData[gameRoom].matchNum--;
    startNextRound(gameRoom);
}

/**
 * End the current round of a given lobby
 *
 * @param {string} gameRoom
 */
function endRound(gameRoom) {

    clearInterval(roundIntervals[gameRoom]);
    // update stats
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('clear', {});
            var word = {};
            word[words[gameRoom]] = {
                guessed: 0,
                drawn: 0
            };
            if (key == lobbyData[gameRoom].drawing) {
                word[words[gameRoom]].drawn++;
                userModel.updateStats(queueData[key].email, 0, 0, 0, 0, word);
            }
            else userModel.updateStats(queueData[key].email, 0, 1, 0, 0, word);
        }
    }
    delete words[gameRoom];
    roundIntervals[gameRoom + "Timer"] = TIMER_ROUND;
    if (lobbyData[gameRoom].i >= lobbyData[gameRoom].sockets.length) {
        if (!io.sockets.adapter.rooms[gameRoom]) {
            endGame(gameRoom, true);
        }
        else if (io.sockets.adapter.rooms[gameRoom].length <= 1) {
            if (io.sockets.adapter.rooms[gameRoom].length == 1)
                io.sockets.connected[Object.keys(io.sockets.adapter.rooms[gameRoom].sockets)[0]].emit('systemMessage', {
                        msg: "Ending game, not enough players in game.",
                        endGame: true
                });
            endGame(gameRoom, true);
        }
        else if (lobbyData[gameRoom].matchNum <= 0) endGame(gameRoom);
        else {
            lobbyData[gameRoom].matchNum--;
            lobbyData[gameRoom].i = 0;
            startNextRound(gameRoom);
        }
    } else {
        startNextRound(gameRoom);
    }
}

/**
 * Start the next round of a given lobby
 *
 * @param {string} gameRoom
 */
function startNextRound(gameRoom) {
    if (io.sockets.adapter.rooms[gameRoom].length == 0) {
        endGame(gameRoom);
        return;
    }
    var drawing = lobbyData[gameRoom].sockets[lobbyData[gameRoom].i];
    lobbyData[gameRoom].i++;
    lobbyData[gameRoom].drawing = drawing;
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
    roundIntervals[gameRoom + "Timer"] = TIMER_ROUND;
    roundIntervals[gameRoom] = setInterval(function() {
        startRoundTimer(gameRoom);
    }, 1000);
}

/**
 * Start the round timer of a given lobby
 *
 * @param {string} gameRoom
 */
function startRoundTimer(gameRoom) {
    var gameRoomLength = 0;
    if (io.sockets.adapter.rooms[gameRoom]) gameRoomLength = io.sockets.adapter.rooms[gameRoom].length;
    if ((gameRoomLength) < 2) {
        io.sockets.connected[Object.keys(io.sockets.adapter.rooms[gameRoom].sockets)[0]].emit('systemMessage', {
            msg: "Ending game, not enough players in game.",
            endGame: true
        });
        endGame(gameRoom, true);
    }
    // do not advance the lobby timer if a word hasn't been chosen
    if (words[gameRoom]) roundIntervals[gameRoom + 'Timer'] -= 1;
    if (io.sockets.adapter.rooms[gameRoom]) {
        for (var key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit('roundTimer', {
                time: roundIntervals[gameRoom + 'Timer']
            });
        }
    }
    if (roundIntervals[gameRoom + 'Timer'] <= 0) {
        endRound(gameRoom);
    }
}

/**
 * Given socket has won the round, inform it's lobby users and update the socket's stats
 *
 * @param {number} id
 * @param {string} gameRoom
 */
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

/**
 * End the game for a given gameroom. If immidiate is passed, game will end without picking a winner.
 *
 * @param {string} gameRoom
 * @param {boolean} immediate default value is false, if the set to true, end game without a winner
 *                            (ie. something has gone wrong, end the game)
 */
function endGame(gameRoom, immediate = false) {
    clearInterval(roundIntervals[gameRoom]);
    //pickWinner
    var key;
    if (!immediate) {
        var gameWinner = '';
        var winnerEmail = '';
        var winnerID;
        var winCount = 0;
        for (key in queueData) {
            if (queueData[key].wincount >= winCount && queueData[key].gameRoom === gameRoom) {
              gameWinner = queueData[key].name;
              winnerID = key;
              winCount = queueData[key].wincount;
              winnerEmail = queueData[winnerID].email;
            }
            if (queueData[key].gameRoom === gameRoom) userModel.updateStats(queueData[key].email, queueData[key].wincount, 0, 0, 1, {});
        }
        for (key in io.sockets.adapter.rooms[gameRoom].sockets) {
            io.sockets.connected[key].emit("gameWinner", {
                name: gameWinner
            });
            io.sockets.connected[key].leave(gameRoom);
            delete lobbyData[gameRoom];
            delete queueData[key];
        }
        io.sockets.connected[winnerID].emit('gameWon', {
            name: gameWinner,
            wincount: winCount
        });
        userModel.updateStats(winnerEmail, 0, 0, 1, 0, {});
    }
    if (io.sockets.adapter.rooms[queueRoom]) {
        for (key in io.sockets.adapter.rooms[queueRoom].sockets) {
            io.sockets.connected[key].emit('gameStatus', {});
        }
    }
}