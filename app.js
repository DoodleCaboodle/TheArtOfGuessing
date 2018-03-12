const express = require('express');
const app = express();

var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://user-01:user-01@art-of-guessing-gdqip.mongodb.net/art-of-guessing";
MongoClient.connect(uri, function(err, client) {
    const collection = client.db("art-of-guessing").collection("users");
    // perform actions on the collection object
    // this is an example table I made, just make any other table you want but keep the database the same
    //    console.log("hello");
    //    collection.find({user:"bob"}).toArray(function(err, result) {
    //        if (err) throw err;
    //        console.log(result);
    //        client.close();
    //    });
})


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
const PORT = process.env.PORT || 3000;

io.on('connection', function(socket){
	socket.on('drawing', function(data){
		socket.broadcast.emit('drawing', data);
	});
});

http.listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
