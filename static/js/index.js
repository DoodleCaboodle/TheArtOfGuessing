(function(){
	"use strict";
    var user = api.getCurrentUser()
    console.log(user);
    if (!user || user === '') {
        window.location.href = '/login';
    }
    window.onload = function() {

    	document.getElementById('brushSize').value = 1;

    	var offsetY = document.getElementById('toolbar').clientHeight;
        
        document.getElementById('start').addEventListener('click', function() {
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('container').style.display = 'flex';
        });
        
        var socket = io();
        var canvas = document.getElementById("myCanvas");
        var context = canvas.getContext("2d");

        var colourPanel = document.getElementById("colourPanel");
        var brushSelector = document.getElementById("brushSize");

        var undoButton = document.getElementById("undo");
        var redoButton = document.getElementById("redo");
        var clearButton = document.getElementById("clear");

        var undoPoints = [];
        var redoPoints = [];

        var imgSrc = canvas.toDataURL("image/png");
        undoPoints.push(imgSrc);

        //drawing flag
        var drawing = false;

        //current location
        var curr = {
            colour: "#000000",
            brushSize: 1
        };
        
        Array.prototype.forEach.call(document.getElementsByClassName("user"), function(d){
            d.innerHTML  = user.split('%40')[0];
        });
        
        document.getElementById("logout").addEventListener("click", function() {
            window.location.href = "/signout"
        });
        
        document.getElementById("feed-input").addEventListener("keypress", function(e){
            var key = e.which || e.keyCode;
            if (key === 13) {
                postFeed();
                document.getElementById("feed-input").value = "";
            }
        });
        
        function postFeed() {
            var msg = document.getElementById("feed-input").value;
            if (msg === '') return;
            var div = document.createElement('div');
            div.classList.add("message");
            div.innerHTML = `<span class="user"> ${user.split('%40')[0]} : </span> ${msg}`;
            document.getElementById("feed").appendChild(div);
            document.getElementById("feed").scrollTop = document.getElementById("feed").scrollHeight;
        }

        function drawLine(fromx, fromy, tox, toy, colour, brushSize, emit) {
            context.beginPath();
            context.moveTo(fromx, fromy);
            context.lineTo(tox, toy);
            context.strokeStyle = colour;
            context.lineWidth = brushSize;
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
            curr.colour = e.target.value;
        });

        colourPanel.addEventListener("change", function(e){
            curr.colour = e.target.value;
        });

        colourPanel.select();

        brushSelector.addEventListener("input", function(e){
            curr.brushSize = e.target.value;
        });

        undoButton.addEventListener("click", function(e){
            if(undoPoints.length > 0) {
                var imgSrc = canvas.toDataURL("image/png");
                redoPoints.push(imgSrc);

                var oldImg = new Image();
                oldImg.onload = function() {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(oldImg, 0, 0);
                }
                var undopoint = undoPoints.pop();
                oldImg.src = undopoint;
                socket.emit('undo', {undopoint: undopoint});
            }
        });

        redoButton.addEventListener("click", function(e){
            if(redoPoints.length > 0){
                var imgSrc = canvas.toDataURL("image/png");
                undoPoints.push(imgSrc);

                var oldImg = new Image();
                oldImg.onload = function() {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(oldImg, 0, 0);
                }
                var redopoint = redoPoints.pop();
                oldImg.src = redopoint;
                socket.emit('redo', {redopoint: redopoint});
            }
        });

        clearButton.addEventListener("click", function(e){
            var imgSrc = canvas.toDataURL("image/png");
            undoPoints.push(imgSrc);
            context.clearRect(0, 0, canvas.width, canvas.height);
            socket.emit('clear', {});
        });

        //pen on paper
        canvas.addEventListener('mousedown', function(e){
            drawing = true;
            curr.x = e.clientX;
            curr.y = e.clientY - offsetY;
        });

        //pen up
        canvas.addEventListener('mouseup', function(e){
            if (drawing) {
                drawing = false;
                drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);

                var imgSrc = canvas.toDataURL("image/png");
                undoPoints.push(imgSrc);
                redoPoints = [];
            }
        });

        canvas.addEventListener('mouseout', function(e){
            if (drawing) {
                drawing = false;
                drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);

                var imgSrc = canvas.toDataURL("image/png");
                undoPoints.push(imgSrc);
                redoPoints = [];
            }
        });

        var lastEmit = Date.now();

        //drawing
        canvas.addEventListener('mousemove', function(e){
            if ((Date.now() - lastEmit) >= 10) {
                if(drawing) {
                    drawLine(curr.x, curr.y, e.clientX, e.clientY - offsetY, curr.colour, curr.brushSize, true);

                    var imgSrc = canvas.toDataURL("image/png");
                    undoPoints.push(imgSrc);
                    redoPoints = [];

                    lastEmit = Date.now();
                    curr.x = e.clientX;
                    curr.y = e.clientY - offsetY;
                }
            }
        });

        socket.on('drawing', function(data){
            drawLine(data.fromx*canvas.width, data.fromy*canvas.height, data.tox*canvas.width, data.toy*canvas.height, data.colour, data.brushSize, false);

            var imgSrc = canvas.toDataURL("image/png");
            undoPoints.push(imgSrc);
            redoPoints = [];
        });

        socket.on('clear', function(data){
            var imgSrc = canvas.toDataURL("image/png");
            undoPoints.push(imgSrc);
            context.clearRect(0, 0, canvas.width, canvas.height);
        });

        socket.on('redo', function(data){
        	var imgSrc = canvas.toDataURL("image/png");
        	undoPoints.push(imgSrc);

        	var oldImg = new Image();
        	oldImg.onload = function() {
        		context.clearRect(0, 0, canvas.width, canvas.height);
        		context.drawImage(oldImg, 0, 0);
        	}

        	oldImg.src = data.redopoint;
        });

        socket.on('undo', function(data){
        	var imgSrc = canvas.toDataURL("image/png");
        	redoPoints.push(imgSrc);

        	var oldImg = new Image();
        	oldImg.onload = function() {
        		context.clearRect(0, 0, canvas.width, canvas.height);
        		context.drawImage(oldImg, 0, 0);
        	}

        	oldImg.src = data.undopoint;
        });

        window.addEventListener('resize', onResize);
        onResize();

        function onResize() {
            canvas.width = document.getElementById("canvas-cont").clientWidth;
            canvas.height = document.getElementById("canvas-cont").clientHeight;
        }
    }
}());