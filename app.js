const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');


// the APP
const app = express();

app.use(express.static('static'));
app.use(bodyParser.json());

app.use(session({
    secret: 'please change this secret',
    resave: false,
    saveUninitialized: true,
}));

app.use(function (req, res, next){
    req.session.username = ('username' in req.session)? req.session.username : null;
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// init all other 
require('./user').init(app);

// Handle 404
app.use(function(req, res) {
    res.status(404).send('404: Page not Found');
});

// Handle 500
app.use(function(error, req, res, next) {
    console.log(error);
    res.status(500).send('500: Internal Server Error');
});

app.use(function (req, res, next){
    console.log("HTTP Response", res.statusCode);
});

const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

io.on('connection', function(socket){
	socket.on('drawing', function(data){
		socket.broadcast.emit('drawing', data);
	});
    
    socket.on('clear', function(data){
		socket.broadcast.emit('clear', data);
	});
});

http.listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
