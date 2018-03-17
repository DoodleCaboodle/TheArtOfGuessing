(function(){
	"use strict";
    var user = api.getCurrentUser()
    if (!user || user === '') {
        window.location.href = '/login';
    }
    window.onload = function() {

    	document.getElementById('brushSize').value = 10;

    	var offsetY = document.getElementById('toolbar').clientHeight;
        
        document.getElementById('start').addEventListener('click', function() {
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('container').style.display = 'flex';
        });
        
        var socket = io();
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
        });

        redoButton.addEventListener("click", function(e){

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
            drawing = true;
            curr.x = e.clientX;
            curr.y = e.clientY - offsetY;
        });

        //pen up
        canvas.addEventListener('mouseup', function(e){
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
        });

        canvas.addEventListener('mouseout', function(e){
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
        });

        var lastEmit = Date.now();

        //drawing
        canvas.addEventListener('mousemove', function(e){
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
        });

        socket.on('clear', function(data){

            undoClearPoints = displayedPoints.slice();

            displayedPoints = [];
            displayedRedoPoints = [];

            context.clearRect(0, 0, canvas.width, canvas.height);
        });

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
    }
}());