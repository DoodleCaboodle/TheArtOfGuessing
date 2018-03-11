(function(){
	"use strict";

	var socket = io();
	var canvas = document.getElementById("myCanvas");
	var context = canvas.getContext("2d");
	var colourPanel = document.getElementById("colourPanel");
	var brushSelector = document.getElementById("brushSize");

	//drawing flag
	var drawing = false;

	//current location
	var curr = {
		colour: "#000000",
		brushSize: 1
	};

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

	//pen on paper
	canvas.addEventListener('mousedown', function(e){
		drawing = true;
		curr.x = e.clientX;
		curr.y = e.clientY;
	});

	//pen up
	canvas.addEventListener('mouseup', function(e){
		if (drawing) {
			drawing = false;
			drawLine(curr.x, curr.y, e.clientX, e.clientY, curr.colour, curr.brushSize, true);
		}
	});

	canvas.addEventListener('mouseout', function(e){
		if (drawing) {
			drawing = false;
			drawLine(curr.x, curr.y, e.clientX, e.clientY, curr.colour, curr.brushSize, true);
		}
	});

	var lastEmit = Date.now();

	//drawing
	canvas.addEventListener('mousemove', function(e){
		if ((Date.now() - lastEmit) >= 10) {
			if(drawing) {
				drawLine(curr.x, curr.y, e.clientX, e.clientY, curr.colour, curr.brushSize, true);
				lastEmit = Date.now();
				curr.x = e.clientX;
				curr.y = e.clientY;
			}
		}
	});

	socket.on('drawing', function(data){
		drawLine(data.fromx*canvas.width, data.fromy*canvas.height, data.tox*canvas.width, data.toy*canvas.height, data.colour, data.brushSize, false);
	});

	window.addEventListener('resize', onResize);
	onResize();

	function onResize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}
}());