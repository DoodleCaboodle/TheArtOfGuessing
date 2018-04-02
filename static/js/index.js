(function() {
    "use strict";
    var user = "";
    var firstName = "";
    var lastName = "";
    api.getCurrentUser(function(err, result) {
        if (err || !result) window.location.href = "/login";
        else {
            user = result;
            if (!user || user === '') {
                window.location.href = '/login';
            } else {
                api.getName(function(err, name) {
                    if (err) console.log(err);
                    else {
                        firstName = name;
                        document.getElementById("loading").classList.add('slide-up');
                        loadWindow();
                        Array.prototype.forEach.call(document.getElementsByClassName("user"), function(d) {
                            d.innerHTML = firstName;
                        });
                        api.getLastName(function(err, lname) {
                            if (err) console.log(err);
                            else {
                                lastName = lname;
                            }
                        });
                    }
                });
            }
        }
    });

    var socket = io();

    window.onunload = function() {
        socket.close();
    };

    var loadWindow = function() {

        document.getElementById('brushSize').value = 10;

        var offsetY = document.getElementById('toolbar').clientHeight + document.getElementById("header").clientHeight;

        // canvas setup
        var canvas = document.getElementById("myCanvas");
        var context = canvas.getContext("2d");

        canvas.width = document.getElementById("canvas-cont").clientWidth;
        canvas.height = document.getElementById("canvas-cont").clientHeight;

        var colourPanel = document.getElementById("colourPanel");
        var brushSelector = document.getElementById("brushSize");

        var undoButton = document.getElementById("undo");
        var redoButton = document.getElementById("redo");
        var clearButton = document.getElementById("clear");

        var displayedPoints = [];
        var displayedRedoPoints = [];
        var undoClearPoints = [];

        //drawing flag
        var canDraw = false;
        var canMessage = true;
        var drawing = false;

        //current location
        var curr = {
            colour: "#000000",
            brushSize: 10
        };

        Array.prototype.forEach.call(document.getElementsByClassName("user"), function(d) {
            d.innerHTML = firstName;
        });

        document.getElementById("feed-input").addEventListener("keypress", function(e) {
            var key = e.which || e.keyCode;
            if (canMessage) {
                if (key === 13) {
                    var msg = document.getElementById("feed-input").value;
                    if (msg !== '') socket.emit('message', {
                        name: firstName,
                        msg: msg
                    });
                    //postFeed(firstName, msg);
                    document.getElementById("feed-input").value = "";
                }
            } else {
                if (key === 13) {
                    document.getElementById("feed-input").value = "";
                    postFeed("System", "You are currently drawing.", "red");
                }
            }
        });

        function postFeed(name, msg, colour = "black") {
            if (msg === '') return;
            var div = document.createElement('div');
            div.classList.add("message");
            div.innerHTML = `<span class="message-name"> ${name}: </span> ${msg}`;
            div.style.color = colour;
            document.getElementById("feed").appendChild(div);
            document.getElementById("feed").scrollTop = document.getElementById("feed").scrollHeight;
        }

        function drawLine(fromx, fromy, tox, toy, colour, brushSize, emit) {
            context.beginPath();
            context.moveTo(fromx, fromy);
            context.lineTo(tox, toy);
            context.strokeStyle = colour;
            context.lineWidth = brushSize;
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.stroke();
            context.closePath();

            if (emit) {
                socket.emit('drawing', {
                    fromx: fromx / canvas.width,
                    fromy: fromy / canvas.height,
                    tox: tox / canvas.width,
                    toy: toy / canvas.height,
                    colour: colour,
                    brushSize: brushSize
                });
            }
        }

        var changePanelColour = function(newColour) {
            var temp = document.createElement('div');
            temp.style.color = newColour;
            document.body.appendChild(temp);
            var rgb = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);
            rgb = rgb.replace(/[^\d,]/g, '').split(',');
            var hex = "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
            colourPanel.value = hex;
        };

        var changeColour = function(newColour) {
            if (canDraw) {
                curr.colour = newColour;
                changePanelColour(newColour);
            }
        };

        colourPanel.addEventListener("input", function(e) {
            changeColour(e.target.value);
        });

        colourPanel.addEventListener("change", function(e) {
            changeColour(e.target.value);
        });

        colourPanel.select();

        var changeBrushSize = function(newBrushSize) {
            if (canDraw) {
                curr.brushSize = newBrushSize;
                brushSelector.value = newBrushSize;
            }
        };

        brushSelector.addEventListener("input", function(e) {
            changeBrushSize(e.target.value);
        });

        var undoFunc = function() {
            if (canDraw) {
                if (displayedPoints.length > 0 || undoClearPoints.length > 0) {
                    if (undoClearPoints.length > 0) {
                        displayedPoints = undoClearPoints.slice();
                        undoClearPoints = [];
                    } else {
                        displayedRedoPoints.push(displayedPoints.pop());
                    }

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    var point;
                    for (var i = 0; i < displayedPoints.length; i++) {
                        point = displayedPoints[i];
                        drawLine(point.fromx * canvas.width, point.fromy * canvas.height, point.tox * canvas.width, point.toy * canvas.height, point.colour, point.brushSize, false);
                    }

                    socket.emit('undo', {});
                }
            }
        };

        undoButton.addEventListener("click", function(e) {
            undoFunc();
        });

        var redoFunc = function() {
            if (canDraw) {
                if (displayedRedoPoints.length > 0) {

                    displayedPoints.push(displayedRedoPoints.pop());

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    var point;
                    for (var i = 0; i < displayedPoints.length; i++) {
                        point = displayedPoints[i];
                        drawLine(point.fromx * canvas.width, point.fromy * canvas.height, point.tox * canvas.width, point.toy * canvas.height, point.colour, point.brushSize, false);
                    }

                    socket.emit('redo', {});
                }
            }
        };

        redoButton.addEventListener("click", function(e) {
            redoFunc();
        });

        var clearFunc = function() {
            if (canDraw) {
                undoClearPoints = displayedPoints.slice();

                displayedPoints = [];
                displayedRedoPoints = [];

                context.clearRect(0, 0, canvas.width, canvas.height);

                socket.emit('clear', {});
            }
        };

        clearButton.addEventListener("click", function(e) {
            clearFunc();
        });

        //pen on paper
        canvas.addEventListener('mousedown', function(e) {
            if (canDraw) {
                drawing = true;
                curr.x = e.clientX;
                curr.y = e.clientY - offsetY;
            }
        });

        //pen up
        canvas.addEventListener('mouseup', function(e) {
            if (canDraw) {
                if (drawing) {
                    drawing = false;
                    drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);
                    displayedPoints.push({
                        fromx: curr.x / canvas.width,
                        fromy: curr.y / canvas.height,
                        tox: e.clientX / canvas.width,
                        toy: (e.clientY - offsetY) / canvas.height,
                        colour: curr.colour,
                        brushSize: curr.brushSize
                    });
                    displayedRedoPoints = [];
                    undoClearPoints = [];
                }
            }
        });

        canvas.addEventListener('mouseout', function(e) {
            if (canDraw) {
                if (drawing) {
                    drawing = false;
                    drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);
                    displayedPoints.push({
                        fromx: curr.x / canvas.width,
                        fromy: curr.y / canvas.height,
                        tox: e.clientX / canvas.width,
                        toy: (e.clientY - offsetY) / canvas.height,
                        colour: curr.colour,
                        brushSize: curr.brushSize
                    });
                    displayedRedoPoints = [];
                    undoClearPoints = [];
                }
            }
        });

        var lastEmit = Date.now();

        //drawing
        canvas.addEventListener('mousemove', function(e) {
            if (canDraw) {
                if ((Date.now() - lastEmit) >= 10) {
                    if (drawing) {

                        drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);
                        displayedPoints.push({
                            fromx: curr.x / canvas.width,
                            fromy: curr.y / canvas.height,
                            tox: e.clientX / canvas.width,
                            toy: (e.clientY - offsetY) / canvas.height,
                            colour: curr.colour,
                            brushSize: curr.brushSize
                        });

                        displayedRedoPoints = [];
                        undoClearPoints = [];

                        lastEmit = Date.now();
                        curr.x = e.clientX;
                        curr.y = e.clientY - offsetY;
                    }
                }
            }
        });

        socket.on('drawing', function(data) {
            drawLine(data.fromx * canvas.width, data.fromy * canvas.height, data.tox * canvas.width, data.toy * canvas.height, data.colour, data.brushSize, false);
            displayedPoints.push({
                fromx: data.fromx,
                fromy: data.fromy,
                tox: data.tox,
                toy: data.toy,
                colour: data.colour,
                brushSize: data.brushSize
            });
            displayedRedoPoints = [];
            undoClearPoints = [];
        });

        socket.on('clear', function(data) {
            undoClearPoints = displayedPoints.slice();

            displayedPoints = [];
            displayedRedoPoints = [];

            context.clearRect(0, 0, canvas.width, canvas.height);
        });

        // canvas setup end

        socket.on('redo', function(data) {
            displayedPoints.push(displayedRedoPoints.pop());

            context.clearRect(0, 0, canvas.width, canvas.height);

            var point;
            for (var i = 0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx * canvas.width, point.fromy * canvas.height, point.tox * canvas.width, point.toy * canvas.height, point.colour, point.brushSize, false);
            }
        });

        socket.on('undo', function(data) {
            if (undoClearPoints.length > 0) {
                displayedPoints = undoClearPoints.slice();
                undoClearPoints = [];
            } else {
                displayedRedoPoints.push(displayedPoints.pop());
            }

            context.clearRect(0, 0, canvas.width, canvas.height);

            var point;
            for (var i = 0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx * canvas.width, point.fromy * canvas.height, point.tox * canvas.width, point.toy * canvas.height, point.colour, point.brushSize, false);
            }
        });

        window.addEventListener('resize', onResize);

        function onResize() {

            canvas.width = document.getElementById("canvas-cont").clientWidth;
            canvas.height = document.getElementById("canvas-cont").clientHeight;

            var point;
            for (var i = 0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx * canvas.width, point.fromy * canvas.height, point.tox * canvas.width, point.toy * canvas.height, point.colour, point.brushSize, false);
            }

            offsetY = document.getElementById('toolbar').clientHeight + document.getElementById("header").clientHeight;
        }

        var readyFunc = function() {
            socket.emit('ready', {
                name: firstName,
                email: user
            });
            document.querySelectorAll(".inqueue").forEach(function(e) {
                e.style.display = 'flex';
            });
            document.getElementById("ready").style.display = 'none';
            document.getElementById('queueTimer').style.display = 'none';
            document.getElementById("cancel").style.display = 'flex';
            //socket.emit('gameStatus', {});
        };

        // queue setup
        document.getElementById('ready').addEventListener('click', readyFunc);

        var cancelFunc = function() {
            socket.emit('leaveQueue', {});
            document.querySelectorAll(".inqueue").forEach(function(e) {
                e.style.display = 'none';
            });
            document.getElementById("ready").style.display = 'flex';
            document.getElementById('queueTimer').style.display = 'none';
            document.getElementById("cancel").style.display = 'none';
        };

        document.getElementById("alert").addEventListener('click', function() {
            document.getElementById("alert").style.display = 'none';
        });

        function initPL() {
            document.getElementById("pl-leave").style.display = "none";
            document.getElementById("pl-create").style.display = "flex";
            document.getElementById("pl-disband").style.display = "flex";
            document.getElementById("pl-start").style.display = "flex";
            document.getElementById("pl-create").disabled = false;
            document.getElementById("pl-disband").disabled = false;
            document.getElementById("pl-start").disabled = false;
            document.getElementById("lobby-name").value = "";
            document.getElementById("lobby-pass").value = "";
            document.getElementById("num-rounds").value = "1";
            document.getElementById("lobby-name").readOnly = false;
            document.getElementById("lobby-pass").readOnly = false;
            document.getElementById("num-rounds").readOnly = false;
            // clean user list
            var paras = document.getElementsByClassName('pl-user');
            while (paras[0]) {
                paras[0].parentNode.removeChild(paras[0]);
            }
        }

        initPL();

        function lockPL() {
            document.getElementById("pl-create").disabled = true;
            document.getElementById("pl-disband").disabled = true;
            document.getElementById("pl-start").disabled = true;
            document.getElementById("lobby-name").readOnly = true;
            document.getElementById("lobby-pass").readOnly = true;
            document.getElementById("num-rounds").readOnly = true;
        }

        document.getElementById("pl-join").addEventListener('click', function() {
            var name = document.getElementById("join-lobby-name").value;
            var pass = document.getElementById("join-lobby-pass").value;
            socket.emit("joinLobby", {
                name: name,
                pass: pass,
                userData: {
                    email: user,
                    name: firstName
                }
            });
            initPL();
            document.getElementById("alert-msg").innerHTML = "Joining lobby!";
            document.getElementById("alert").style.display = "flex";
        });

        document.getElementById("pl-leave").addEventListener('click', function() {
            document.getElementById("alert-msg").innerHTML = "Leaving lobby!";
            document.getElementById("alert").style.display = "flex";
            socket.emit("leaveLobby", {});
            initPL();
        });

        document.getElementById("pl-create").addEventListener('click', function() {
            document.getElementById("alert-msg").innerHTML = "Creating lobby!";
            document.getElementById("alert").style.display = "flex";
            var name = document.getElementById("lobby-name").value;
            var pass = document.getElementById("lobby-pass").value;
            var numRounds = document.getElementById("num-rounds").value;
            var data = {
                userData: {
                    email: user,
                    name: firstName
                },
                name: name,
                pass: pass,
                numRounds: numRounds
            };
            socket.emit("createLobby", data);
        });

        document.getElementById("pl-disband").addEventListener('click', function() {
            document.getElementById("alert-msg").innerHTML = "Removing lobby!";
            document.getElementById("alert").style.display = "flex";
            var name = document.getElementById("lobby-name").value;
            socket.emit("disbandPL", {
                name: name
            });
        });

        document.getElementById("pl-start").addEventListener('click', function() {
            document.getElementById("alert-msg").innerHTML = "Starting lobby!";
            document.getElementById("alert").style.display = "flex";
            var name = document.getElementById("lobby-name").value;
            socket.emit("startLobby", {
                name: name
            });
        });

        document.getElementById('cancel').addEventListener('click', cancelFunc);

        var logoutFunc = function() {
            window.location.href = "/signout";
        };

        var profileFunc = function() {
            window.location.href = "/profile";
        };

        var homeFunc = function() {
            window.location.href = "/";
        };

        var backFunc = function() {
            window.history.back();
        };

        var nextFunc = function() {
            window.history.forward();
        };

        var sendMessage = function(msg) {
            if (!canDraw) {
                if (msg !== '') socket.emit('message', {
                    name: firstName,
                    msg: msg
                });
            }
        };

        //VOICE REC
        if (annyang) {
            var commands = {
                'ready': readyFunc,
                'queue up': readyFunc,
                'cancel': cancelFunc,
                'logout': logoutFunc,
                'log out': logoutFunc,
                'sign out': logoutFunc,
                'signout': logoutFunc,
                'profile': profileFunc,
                'home': homeFunc,
                'back': backFunc,
                'next': nextFunc,
                'forward': nextFunc,
                'change color to :newColour': changeColour,
                'change brush size to :newBrushSize': changeBrushSize,
                'undo': undoFunc,
                'redo': redoFunc,
                'clear': clearFunc,
                'send *message': sendMessage,
                'help me': function() {
                    document.getElementById('overlay').style.display = "flex";
                },
                'thank you': function() {
                    document.getElementById('overlay').style.display = "none";
                }
            };

            annyang.addCommands(commands);
            annyang.start();
            document.getElementById('pauseVoice').style.display = "flex";
        } else {
            //CHANGE THE CONTENT OF THE VOICE COMMANDS PART HERE
            document.getElementById('voiceCommands').innerHTML = "Sorry, your browser does not support speech recognition. If you want to use this feature, try to use Chrome instead.";
        }

        document.getElementById("helpButton").addEventListener('click', function(){
            document.getElementById('overlay').style.display = "flex";
        });

        document.getElementById("close_help").addEventListener('click', function() {
            document.getElementById('overlay').style.display = "none";
        });

        var pauseVoice = function() {
            annyang.pause();
            document.getElementById('pauseVoice').style.display = "none";
            document.getElementById('resumeVoice').style.display = "flex";
        };

        var resumeVoice = function() {
            annyang.resume();
            document.getElementById('pauseVoice').style.display = "flex";
            document.getElementById('resumeVoice').style.display = "none";
        };

        document.getElementById('pauseVoice').addEventListener('click', function() {
            pauseVoice();
        });

        document.getElementById('resumeVoice').addEventListener('click', function() {
            resumeVoice();
        });

        // request info from server
        socket.emit('getQueueStatus', {});

        // handle server responses
        // handle private lobby responses

        socket.on("updatePl", function(data) {
            // clean user list
            var paras = document.getElementsByClassName('pl-user');
            while (paras[0]) {
                paras[0].parentNode.removeChild(paras[0]);
            }
            console.log(data.users);
            data.users.forEach(function(user) {
                var div = document.createElement("div");
                div.classList.add("pl-user");
                div.innerHTML = `<div class="pl-user-name">${user}</div>`;
                document.getElementById("pl-users-list").appendChild(div);
            });
        });

        socket.on('updateUserList', function(data) {
            document.getElementById("users-list").innerHTML = '';
            addPlayers(data.playerList);
        });

        socket.on("createLobby", function(data) {
            document.getElementById("alert").style.display = 'none';
        });

        socket.on("leaveLobby", function(data) {
            document.getElementById("alert").style.display = 'none';
            initPL();
        });

        socket.on("startLobby", function(data) {
            document.getElementById("alert").style.display = 'none';
        });

        socket.on("joinedLobby", function(data) {
            document.getElementById("alert").style.display = "none";
            if (data.valid) {
                document.getElementById("join-lobby-name").value = "";
                document.getElementById("join-lobby-pass").value = "";
                lockPL();
                document.getElementById("pl-leave").style.display = "flex";
                document.getElementById("pl-create").style.display = "none";
                document.getElementById("lobby-name").value = data.name;
                document.getElementById("lobby-pass").value = data.pass;
            } else initPL();
        });

        socket.on("disbandPL", function(data) {
            document.getElementById("alert").style.display = "none";
            initPL();
        });

        socket.on("notification", function(data) {
            swal(data.msg);
        });
        // queue timer
        socket.on('stopQueueTimer', function(data) {
            document.getElementById('queue-time').innerHTML = '';
            document.getElementById('queueTimer').style.display = 'none';
        });
        // queue timer stop
        socket.on('queueTimer', function(data) {
            document.getElementById('queue-time').innerHTML = data.time;
            document.getElementById('queueTimer').style.display = 'flex';
        });
        // round timer
        socket.on('roundTimer', function(data) {
            document.getElementById('time').innerHTML = data.time;
        });
        // mesages
        socket.on('message', function(data) {
            postFeed(data.name, data.msg);
        });
        // update user list
        socket.on('', function(data) {

        });
        // queueupdated
        socket.on('queueUpdated', function(data) {
            if (data.numInQueue < 2) document.getElementById('queueTimer').style.display = 'none';
            document.getElementById('num-in-queue').innerHTML = data.numInQueue;
        });
        // gameWinner
        socket.on('gameWinner', function(data) {
            // do a popup
            swal({
              title: "Game Over!",
              text: data.name + " won!"
            }).then(result => {
              if (result.value) {
                goBack();
                //swal("Deleted!", "Your file has been deleted.", "success");
              }
            });
        });

        // game won
        socket.on('gameWon', function(data) {

            // special pop up for you won the game
            console.log("gamewon: ", data.gameWinner);
        });
        // round won
        socket.on('won', function(data) {
            document.getElementById('rwinner').innerHTML = data.name;
            document.getElementById(data.email).innerHTML = data.wincount;
        });
        // draw
        socket.on('draw', function(data) {
            // canDraw = true;
            canMessage = false;
            getWord();
            document.getElementById("feed-input").style.display = "none";
        });
        // no draw
        socket.on('noDraw', function(data) {
            canDraw = false;
            canMessage = true;
            document.getElementById("feed-input").style.display = "flex";
            document.getElementById("word").innerHTML = "";
        });
        // startgame
        socket.on('startGame', function(data) {
            initPL();
            // reset start-container
            document.getElementById('queueTimer').innerHTML = '';
            document.getElementById('gameStatus').innerHTML = '';
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('container').style.display = 'flex';
            addPlayers(data.playerList);
            onResize();
        });
        // gameStatus
        socket.on('gameStatus', function(data) {
            document.getElementById('gameStatus').innerHTML = 'You are in queue for the next game';
        });
        // system message
        socket.on('systemMessage', function(data) {
            var color = 'red';
            if (data.color)
                color = data.color;
            postFeed('System', data.msg, color);

            if (data.endGame) setTimeout(goBack, 1000);
        });
        // current word
        socket.on('word', function(data) {
            document.getElementById("word").innerHTML = data.word;
        });

        function addPlayers(players) {
            players.forEach(function(p) {
                var div = document.createElement('div');
                div.classList.add("user-icon");
                div.innerHTML = `<div class="user-wins"><span id="${p.email}" class="wincount">${p.wincount}</span></div>
                            <span class="user">${p.name}</span>`;
                document.getElementById("users-list").appendChild(div);
            });
        }

        function getWord() {
            popup();
        }

        function popup() {
            document.getElementById('word-to-draw').value = '';
            document.getElementById('popup').style.display = 'flex';
            document.getElementById('submit-word').addEventListener('click', function() {
                var word = document.getElementById('word-to-draw').value;
                if (word !== '') {
                    document.getElementById("word").innerHTML = word;
                    socket.emit('word', {
                        word: word
                    });
                    document.getElementById('word-to-draw').value = '';
                    document.getElementById('popup').style.display = 'none';
                    canDraw = true;
                }
            });
            document.getElementById("word-to-draw").addEventListener("keypress", function(e) {
            var key = e.which || e.keyCode;
            if (key === 13) {
                var word = document.getElementById('word-to-draw').value;
                if (word !== '') {
                    document.getElementById("word").innerHTML = word;
                    socket.emit('word', {
                        word: word
                    });
                    document.getElementById('word-to-draw').value = '';
                    document.getElementById('popup').style.display = 'none';
                    canDraw = true;
                }
            }
        });
        }

        function goBack() {
            document.getElementById("popup").style.display = "none";
            window.location.href = '/';
        }
    };
}());