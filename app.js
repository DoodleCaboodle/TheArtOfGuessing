const express = require('express');
const session = require('express-session');
const cookie = require('cookie');
const bodyParser = require('body-parser');
const queueLimit = 2;

// game queue
var queue = [];
var flushQueue = [];

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
    var email = (req.session.username)? req.session.username : '';
    res.setHeader('Set-Cookie', cookie.serialize('email', email, {
          path : '/', 
          maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// init all other 
require('./user').init(app);

// manage single game queue
app.get('/join/:email', function(req, res, next) {
    queue.push(req.params.email);
    if (queue.length == queueLimit) {
        flushQueue = queue;
        queue = [];
        return res.json(2);
    }
    return res.json(queue.length);
});

app.get('queue', function(req, res, next) {
    if (queue.length != 0) 
        return res.json(queue);
    else 
        return res.json(flushQueue);
});

// Handle 404
app.use(function(req, res) {
    return res.status(404).send('404: Page not Found');
});

// Handle 500
app.use(function(error, req, res, next) {
    console.log(error);
    return res.status(500).send('500: Internal Server Error');
});

app.use(function (req, res, next){
    console.log("HTTP Response", res.statusCode);
});

const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

io.on('connection', function(socket) {
	socket.on('drawing', function(data){
		socket.broadcast.emit('drawing', data);
	});
    
    socket.on('clear', function(data) {
		socket.broadcast.emit('clear', data);
	});
    
    socket.on('join', function(data) {
        socket.broadcast.email('join', data);
    });
});

http.listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
