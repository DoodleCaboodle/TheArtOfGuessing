(function(){
	"use strict";

	var socket = io();
	var canvas = document.getElementById("myCanvas");
	var context = canvas.getContext("2d");

	//drawing flag
	var drawing = false;

	//current location
	var curr = {};

	function drawLine(fromx, fromy, tox, toy, emit) {
		context.beginPath();
		context.moveTo(fromx, fromy);
		context.lineTo(tox, toy);
		context.stroke();
		context.closePath();

		if (emit) {
			socket.emit('drawing', {
				fromx: fromx / canvas.width,
				fromy: fromy / canvas.height,
				tox: tox / canvas.width,
				toy: toy / canvas.height
			});
		}
	}

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
			drawLine(curr.x, curr.y, e.clientX, e.clientY, true);
		}
	});

	//pen outside of the paper
	canvas.addEventListener('mouseout', function(e){
		if (drawing) {
			drawing = false;
			drawLine(curr.x, curr.y, e.clientY, e.clientY, true);
		}
	});

	var lastEmit = Date.now();

	//drawing
	canvas.addEventListener('mousemove', function(e){
		if (drawing) {
			if((Date.now() - lastEmit) > 30) {
				drawLine(curr.x, curr.y, e.clientX, e.clientY, true);
				lastEmit = Date.now();
				curr.x = e.clientX;
				curr.y = e.clientY;
			}
		}
	});

	socket.on('drawing', function(data){
		drawLine(data.fromx*canvas.width, data.fromy*canvas.height, data.tox*canvas.width, data.toy*canvas.height, false);
	});

	window.addEventListener('resize', function(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	});
}());