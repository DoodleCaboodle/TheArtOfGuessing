const bcrypt = require('bcrypt');
const cookie = require('cookie');
const User = require('./user');
const config = require('../config.js');

var MongoClient = require('mongodb').MongoClient;
var uri = config.uri;


var authenticateMiddleware = function(req, res, next) {
    console.log(req.session.username);
    if (!req.session.username || req.session.username == '') res.sendFile(config.filepath + 'profile/login.html');
    else next();
}

var getSalt = function() {
    return bcrypt.genSaltSync(10);
}

var getSaltedHash = function(pass, salt) {
    return bcrypt.hashSync(pass, salt);
}

var authenticate = function(req, res, email, pass, callback) {
    User.findByEmail(email, function(err, result){
        if (err) callback(err, null);
        if (result.length == 1 && result[0].email === email && bcrypt.compareSync(pass, result[0].password)) {
            
            req.session.username = email;
            res.setHeader('Set-Cookie', cookie.serialize('email', email, {
                  path : '/', 
                  maxAge: 60 * 60 * 24 * 7
            }));
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    });
}

var register = function(req, res, user, callback) {
    if (!user) callback(null, false);
    else {
        User.findByEmail(user.email, function(err, result) {
            if (result.length > 0) callback(null, false);
            else {
                req.session.username = user.email;
                MongoClient.connect(uri, function(err, client) {
                    const collection = client.db("art-of-guessing").collection("users");
                    collection.insertOne({email:user.email, password:user.password, salt:user.salt, firstname:user.firstname, lastname:user.lastname}).then(function(result){
                        // something
                    });
                });
                res.setHeader('Set-Cookie', cookie.serialize('email', user, {
                      path : '/', 
                      maxAge: 60 * 60 * 24 * 7
                }));
                callback(null, true);
            }
        });
    }
}

var logout = function(req, res, callback) {
    req.session.username = '';
    res.setHeader('Set-Cookie', cookie.serialize('email', '', {
          path : '/', 
          maxAge: 60 * 60 * 24 * 7
    }));
    callback(null, true);
}

function init(app) {
    // create

    app.post('/signin/', function(req, res, next) {
        var email = req.body.email;
        var pass = req.body.password;
        authenticate(req, res, email, pass, function(err, success) {
            if (err) return res.status(500).end(err);
            if (success) return res.json("user " + email + " signed in");
            else return res.status(401).end("access denied");
        });
    });
    
    app.post('/signup/', function(req, res, next){
        console.log(User);
        var salt = getSalt();
        var hash = getSaltedHash(req.body.password, salt);
        var newUser = new User(req.body.email, hash, salt, req.body.firstname, req.body.lastname);
        register(req, res, newUser, function(err, success) {
            if (err) return res.status(500).end(err);
            if (success) return res.json("User " + req.body.email + " signed up");
            else return res.status(409).end("email " + req.body.email + " already exists");
        });
    });

    app.post('/signout/', function(req, res, next){
        logout(req, res, function(err, success) {
            if (success) res.redirect('/');
            else res.redirect('/login');
        });
    });

    // retrieve

    app.get('/login/', authenticateMiddleware, function(req, res, next){
        res.sendFile(config.filepath + 'profile/profile.html');
    });

    app.get('/profile/', authenticateMiddleware, function(req, res, next){
        res.sendFile(config.filepath + 'profile/profile.html');
    });

    // update

    // delete
}


module.exports = {init: init};