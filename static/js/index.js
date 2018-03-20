(function(){
	"use strict";
    var user = api.getCurrentUser();
    var firstName = '';
    console.log(user);
    if (!user || user === '') {
        window.location.href = '/login';
    }
    else {
        api.getName(user, function(err, name) {
            console.log(name);
            if (err) console.log(err);
            else {
                firstName = name;
                 Array.prototype.forEach.call(document.getElementsByClassName("user"), function(d){
                    console.log(firstName);
                    d.innerHTML  = firstName;
                });
            }
        });
    }
        
    var socket = io();
    
    window.onunload = function() {
        socket.close();    
    }
    
    window.onload = function() {

        try{
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            var recognition = new SpeechRecognition();
        } catch (e) {
            document.getElementById('speech-rec-btns').style.display = "none";
            postFeed("System", "Sorry, your browser does not support speech recognition. If you want to use this feature, try to use Chrome instead.", "red");
        }

        if (recognition) {
            recognition.continous = true;

            recognition.onresult = function(e) {
                var transcript = e.results[e.resultIndex][0].transcript;
                document.getElementById("feed-input").value = transcript;
            }
        }

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
        
        Array.prototype.forEach.call(document.getElementsByClassName("user"), function(d){
            console.log(firstName);
            d.innerHTML  = firstName;
        });
        
        

        document.getElementById("start-record-btn").addEventListener('click', function(e) {
            recognition.start();
            console.log("Listening");
        });

        document.getElementById("pause-record-btn").addEventListener('click', function(e){
            recognition.stop();
        });
        
        document.getElementById("feed-input").addEventListener("keypress", function(e){
            var key = e.which || e.keyCode;
            if (canMessage) {
                if (key === 13) {
                    var msg = document.getElementById("feed-input").value;
                    if (msg !== '') socket.emit('message', {name:firstName, msg:msg});
                    postFeed(firstName, msg);
                }
            }
            else {
                if (key === 13) {
                    postFeed("System", "You are currently drawing.", "red");
                }
            }
        });
        
        function postFeed(name, msg, colour="black") {
            if (msg === '') return;
            console.log(name);
            var div = document.createElement('div');
            div.classList.add("message");
            div.innerHTML = `<span class="message-name"> ${name}: </span> ${msg}`;
            div.style.color = colour;
            document.getElementById("feed").appendChild(div);
            document.getElementById("feed").scrollTop = document.getElementById("feed").scrollHeight;
            document.getElementById("feed-input").value = "";
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

        colourPanel.addEventListener("input", function(e){
            if (canDraw) curr.colour = e.target.value;
        });

        colourPanel.addEventListener("change", function(e){
            if (canDraw) curr.colour = e.target.value;
        });

        colourPanel.select();

        brushSelector.addEventListener("input", function(e){
            if (canDraw) curr.brushSize = e.target.value;
        });

        undoButton.addEventListener("click", function(e){
            if (canDraw) {
                if (displayedPoints.length > 0 || undoClearPoints.length > 0){
                    if (undoClearPoints.length > 0) {
                        displayedPoints = undoClearPoints.slice();
                        undoClearPoints = [];
                    } else {
                        displayedRedoPoints.push(displayedPoints.pop());
                    }   

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    var point;
                    for (var i=0; i < displayedPoints.length; i++) {
                        point = displayedPoints[i];
                        drawLine(point.fromx*canvas.width, point.fromy*canvas.height, point.tox*canvas.width, point.toy*canvas.height, point.colour, point.brushSize, false);
                    }

                    socket.emit('undo', {});
                }

            }
        });

        redoButton.addEventListener("click", function(e){
            if (canDraw) {
                if(displayedRedoPoints.length > 0){

                    displayedPoints.push(displayedRedoPoints.pop());

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    var point;
                    for (var i=0; i < displayedPoints.length; i++) {
                        point = displayedPoints[i];
                        drawLine(point.fromx*canvas.width, point.fromy*canvas.height, point.tox*canvas.width, point.toy*canvas.height, point.colour, point.brushSize, false);
                    }

                    socket.emit('redo', {});
                }
            }
        });

        clearButton.addEventListener("click", function(e){
            undoClearPoints = displayedPoints.slice();

            displayedPoints = [];
            displayedRedoPoints = [];

            context.clearRect(0, 0, canvas.width, canvas.height);

            socket.emit('clear', {});
        });

        //pen on paper
        canvas.addEventListener('mousedown', function(e){
            if (canDraw) {
                drawing = true;
                curr.x = e.clientX;
                curr.y = e.clientY - offsetY;
            }
        });

        //pen up
        canvas.addEventListener('mouseup', function(e){
            if (canDraw) {
                if (drawing) {
                    drawing = false;
                    drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);
                    displayedPoints.push({
                        fromx:curr.x / canvas.width, 
                        fromy:curr.y / canvas.height, 
                        tox:e.clientX / canvas.width, 
                        toy:(e.clientY - offsetY) / canvas.height, 
                        colour:curr.colour, 
                        brushSize:curr.brushSize});
                    displayedRedoPoints = [];
                    undoClearPoints = [];
                }
            }
        });

        canvas.addEventListener('mouseout', function(e){
            if (canDraw) {
                if (drawing) {
                    drawing = false;
                    drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);
                    displayedPoints.push({
                        fromx:curr.x / canvas.width, 
                        fromy:curr.y / canvas.height, 
                        tox:e.clientX / canvas.width, 
                        toy:(e.clientY - offsetY) / canvas.height, 
                        colour:curr.colour, 
                        brushSize:curr.brushSize});
                    displayedRedoPoints = [];
                    undoClearPoints = [];
                }
            }
        });

        var lastEmit = Date.now();

        //drawing
        canvas.addEventListener('mousemove', function(e){
            if (canDraw) {
                if ((Date.now() - lastEmit) >= 10) {
                    if(drawing) {

                        drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);
                        displayedPoints.push({
                            fromx:curr.x / canvas.width, 
                            fromy:curr.y / canvas.height, 
                            tox:e.clientX / canvas.width, 
                            toy:(e.clientY - offsetY) / canvas.height, 
                            colour:curr.colour, 
                            brushSize:curr.brushSize});

                        displayedRedoPoints = [];
                        undoClearPoints = [];

                        lastEmit = Date.now();
                        curr.x = e.clientX;
                        curr.y = e.clientY - offsetY;
                    }
                }
            }
        });

        socket.on('drawing', function(data){
            drawLine(data.fromx*canvas.width, data.fromy*canvas.height, data.tox*canvas.width, data.toy*canvas.height, data.colour, data.brushSize, false);
            displayedPoints.push({
                        fromx:data.fromx, 
                        fromy:data.fromy, 
                        tox:data.tox, 
                        toy:data.toy, 
                        colour:data.colour, 
                        brushSize:data.brushSize});
            displayedRedoPoints = [];
            undoClearPoints = [];
        });

        socket.on('clear', function(data){
            undoClearPoints = displayedPoints.slice();

            displayedPoints = [];
            displayedRedoPoints = [];

            context.clearRect(0, 0, canvas.width, canvas.height);
        });
        
        // canvas setup end

        socket.on('redo', function(data){
        	displayedPoints.push(displayedRedoPoints.pop());

            context.clearRect(0, 0, canvas.width, canvas.height);

            var point;
            for (var i=0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx*canvas.width, point.fromy*canvas.height, point.tox*canvas.width, point.toy*canvas.height, point.colour, point.brushSize, false);
            }
        });

        socket.on('undo', function(data){
        	if (undoClearPoints.length > 0){
                displayedPoints = undoClearPoints.slice();
                undoClearPoints = [];
            } else {
                displayedRedoPoints.push(displayedPoints.pop());
            }

            context.clearRect(0, 0, canvas.width, canvas.height);

            var point;
            for (var i=0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx*canvas.width, point.fromy*canvas.height, point.tox*canvas.width, point.toy*canvas.height, point.colour, point.brushSize, false);
            }
        });

        window.addEventListener('resize', onResize);
        //onResize();

        function onResize() {

            canvas.width = document.getElementById("canvas-cont").clientWidth;
            canvas.height = document.getElementById("canvas-cont").clientHeight;

            var point;
            for (var i=0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx*canvas.width, point.fromy*canvas.height, point.tox*canvas.width, point.toy*canvas.height, point.colour, point.brushSize, false);
            }

            offsetY = document.getElementById('toolbar').clientHeight + document.getElementById("header").clientHeight;
        }
        
        // queue setup
        document.getElementById('ready').addEventListener('click', function() {
            socket.emit('ready', {name:firstName, email:user}); 
            document.querySelectorAll(".inqueue").forEach(function(e){
                e.style.display = 'flex';
            });
            document.getElementById("ready").style.display = 'none';
            document.getElementById('queueTimer').style.display = 'none';
            document.getElementById("cancel").style.display = 'flex';            
            //socket.emit('gameStatus', {});
        });
        
        document.getElementById('cancel').addEventListener('click', function() {
            socket.emit('leaveQueue', {});
            document.querySelectorAll(".inqueue").forEach(function(e){
                e.style.display = 'none';
            });
            document.getElementById("ready").style.display = 'flex';
            document.getElementById('queueTimer').style.display = 'none';
            document.getElementById("cancel").style.display = 'none';
        });
        
        // request info from server
        socket.emit('getQueueStatus', {});
        
        // handle server responses
        // queue timer
        socket.on('stopQueueTimer', function(data){
            console.log('stop timer');
            document.getElementById('queue-time').innerHTML = '';
            document.getElementById('queueTimer').style.display = 'none';
        });
        // queue timer stop
        socket.on('queueTimer', function(data){
            console.log('queue timer', data.time);
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
            if (data.numInQueue < 2) document.getElementById('queueTimer').style.display = 'none'
            document.getElementById('num-in-queue').innerHTML = data.numInQueue;
        });
        // gameWinner
        socket.on('gameWinner', function(data) {
            // do a popup
            alert(data.name+" won!");
            goBack();
        });
        // game won
        socket.on('gameWon', function(data) {
            
            // special pop up for you won the game
            console.log("gamewon: ", data.gameWinner);
        });
        // round won
        socket.on('won', function(data) {
            document.getElementById('rwinner').innerHTML = data.name;
        });
        // draw
        socket.on('draw', function(data) {
            canDraw = true;
            canMessage = false;
            getWord();
            document.getElementById("speech-rec-btns").style.display = "none";
            document.getElementById("feed-input").style.display = "none";
        });
        // no draw
        socket.on('noDraw', function(data) {
            canDraw = false;
            canMessage = true;
            document.getElementById("speech-rec-btns").style.display = "flex";
            try{
            	var check1 = window.SpeechRecognition || window.webkitSpeechRecognition;
            	var check2 = new SpeechRecognition();
        	} catch (e) {
            	document.getElementById('speech-rec-btns').style.display = "none";
            	//postFeed("System", "Sorry, your browser does not support speech recognition. If you want to use this feature, try to use Chrome instead.", "red");
        	}
            document.getElementById("feed-input").style.display = "flex";
            document.getElementById("word").innerHTML = "";
        });
        // startgame
        socket.on('startGame', function(data) {
            // reset start-container
            document.getElementById('queueTimer').innerHTML = '';
            document.getElementById('gameStatus').innerHTML = '';
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('container').style.display = 'flex';
            onResize();
        });
        // gameStatus
        socket.on('gameStatus', function(data) {
            if (data.gameStarted) {
                document.getElementById('gameStatus').innerHTML = 'Please wait for the current game to finish';
            } 
            else {
                document.getElementById('gameStatus').innerHTML = 'You are in queue for the next game';
            }
        });
        // system message
        socket.on('systemMessage', function(data) {
            var color = 'red';
            if (data.color)
                color = data.color;
            postFeed('System', data.msg, color);
            
            if (data.endGame) setTimeout(goBack,1000);;
        });
        // current word
        socket.on('word', function(data) {
            document.getElementById("word").innerHTML = data.word;
        });        
        
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
                    socket.emit('word', {word:word});
                    document.getElementById('word-to-draw').value = '';
                    document.getElementById('popup').style.display = 'none';
                }
            });
        }
        
        function goBack() {
            window.location.href = '/';
        }
    }
}());