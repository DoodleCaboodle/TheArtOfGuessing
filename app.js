const express = require('express');
const app = express();

app.use(express.static('static'));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// Handle 404
app.use(function(req, res) {
    res.send('404: Page not Found', 404);
});

// Handle 500
app.use(function(error, req, res, next) {
    res.send('500: Internal Server Error', 500);
});

app.use(function (req, res, next){
    console.log("HTTP Response", res.statusCode);
});

const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
