const express = require('express');
const session = require('express-session');
const cookie = require('cookie');
const bodyParser = require('body-parser');
// the APP
const app = express();

app.use(express.static('static'));
app.use(bodyParser.json());

app.use(session({
    secret: 'superdupersectrtpassword1234',
    resave: false,
    saveUninitialized: true,
}));

app.use(function(req, res, next) {
    req.session.username = ('username' in req.session) ? req.session.username : null;
    var email = (req.session.username) ? req.session.username : '';
    res.setHeader('Set-Cookie', cookie.serialize('email', email, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// init all other 
require('./user').init(app);
var server = require('./server');


// Handle 404
app.use(function(req, res) {
    return res.status(404).send('404: Page not Found');
});

// Handle 500
app.use(function(error, req, res, next) {
    console.log(error);
    return res.status(500).send('500: Internal Server Error');
});

app.use(function(req, res, next) {
    console.log("HTTP Response", res.statusCode);
});

// const fs = require('fs');
// const https = require('https');
// var privateKey = fs.readFileSync('server.key');
// var certificate = fs.readFileSync('server.crt');
// var config = {
//     key: privateKey,
//     cert: certificate
// };
// const httpsServer = https.createServer(config, app);

// const io = require('socket.io')(httpsServer);

const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

io.on('connection', function(socket) {
    server.init(io, socket);
});

http.listen(PORT, function(err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
// httpsServer.listen(PORT, function (err) {
//     if (err) console.log(err);
//     else console.log("HTTPS server on https://localhost:%s", PORT);
// });