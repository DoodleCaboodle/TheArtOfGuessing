(function(){
	"use strict";
    var user = api.getCurrentUser()
    console.log(user);
    if (!user || user === '') {
        window.location.href = '/login';
    }
    
    var socket = io();
    
    window.onunload = function() {
        socket.close();    
    }
    
    window.onload = function() {

    	document.getElementById('brushSize').value = 10;

    	var offsetY = document.getElementById('toolbar').clientHeight;
        
        // canvas setup
        var canvas = document.getElementById("myCanvas");
        var context = canvas.getContext("2d");

        canvas.width = document.getElementById("canvas-cont").clientWidth;
        canvas.height = document.getElementById("canvas-cont").clientHeight;

        // context.mozImageSmoothingEnabled = true;
        // context.webkitImageSmoothingEnabled = true;
        // context.msImageSmoothingEnabled = true;
        // context.imageSmoothingEnabled = true;

        var colourPanel = document.getElementById("colourPanel");
        var brushSelector = document.getElementById("brushSize");

        var undoButton = document.getElementById("undo");
        var redoButton = document.getElementById("redo");
        var clearButton = document.getElementById("clear");

        // var undoPoints = [];
        // var redoPoints = [];

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
            d.innerHTML  = user.split('%40')[0];
        });
        
        document.getElementById("logout").addEventListener("click", function() {
            window.location.href = "/signout"
        });
        
        document.getElementById("feed-input").addEventListener("keypress", function(e){
            if (canMessage) {
                var key = e.which || e.keyCode;
                if (key === 13) {
                    var msg = document.getElementById("feed-input").value;
                    if (msg !== '') socket.emit('message', {name:user.split('%40')[0], msg:msg});
                    postFeed(user.split('%40')[0], msg);
                }
            }
            else {
                if (key === 13) {
                    postFeed("you are currently drawing.");
                }
            }
        });
        
        function postFeed(name, msg) {
            if (msg === '') return;
            var div = document.createElement('div');
            div.classList.add("message");
            div.innerHTML = `<span class="user"> ${name} : </span> ${msg}`;
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
        onResize();

        function onResize() {

            canvas.width = document.getElementById("canvas-cont").clientWidth;
            canvas.height = document.getElementById("canvas-cont").clientHeight;

            var point;
            for (var i=0; i < displayedPoints.length; i++) {
                point = displayedPoints[i];
                drawLine(point.fromx*canvas.width, point.fromy*canvas.height, point.tox*canvas.width, point.toy*canvas.height, point.colour, point.brushSize, false);
            }

            offsetY = document.getElementById('toolbar').clientHeight;
        }
        
        // queue setup
        document.getElementById('ready').addEventListener('click', function() {
            socket.emit('ready', {name:user.split('%40')[0], email:user.split('%40')[0]}); 
            //socket.emit('gameStatus', {});
        });
        
        // handle server responses
        // queue timer
        socket.on('queueTimer', function(data){
            console.log('queue timer', data.time);
            document.getElementById('queueTimer').innerHTML = data.time;
        });
        // round timer
        socket.on('roundTimer', function(data) {
            console.log(offsetY);
            document.getElementById('time').innerHTML = data.time;
        });
        // mesages
        socket.on('message', function(data) {
            postFeed(data.name, data.msg);
        });
        // update user list
        socket.on('', function(data) {
            
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
        });
        // no draw
        socket.on('noDraw', function(data) {
            canDraw = false;
            canMessage = true;
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
        // current word
        socket.on('word', function(data) {
            document.getElementById("word").innerHTML = data.word;
        });
        
        function getWord() {
            var word = prompt("Please enter what you will be drawing:", "HOUSE");
            document.getElementById("word").innerHTML = word;
            socket.emit('word', {word:word});
        }
        
        function goBack() {
            document.getElementById('queueTimer').innerHTML = '';
            document.getElementById('gameStatus').innerHTML = '';
            document.getElementById('start-container').style.display = 'flex';
            document.getElementById('container').style.display = 'none';
        }
    }
}());