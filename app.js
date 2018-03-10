const express = require('express');
const app = express();

app.use(express.static('static'));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// Handle 404
app.use(function(req, res) {
    res.status(404).send('404: Page not Found');
});

// Handle 500
app.use(function(error, req, res, next) {
    res.status(500).send('500: Internal Server Error');
});

app.use(function (req, res, next){
    console.log("HTTP Response", res.statusCode);
});

const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = 3000;

io.on('connection', function(socket){
	socket.on('drawing', function(data){
		socket.broadcast.emit('drawing', data);
	});
});

http.listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
