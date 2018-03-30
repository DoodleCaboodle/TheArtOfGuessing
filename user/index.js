const bcrypt = require('bcrypt');
const cookie = require('cookie');
const User = require('./user');
const config = require('../config.js');
const connectEnsureLogin = require('connect-ensure-login');

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

var MongoClient = require('mongodb').MongoClient;
var uri = config.uri;

passport.use(new FacebookStrategy({
        clientID: "1018938084949411",
        clientSecret: "d9714e57a4e79daf4d233f38f3d63d33",
        callbackURL: "https://art-of-guessing.herokuapp.com/login/facebook/callback",
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name']
    },
    function(req, accessToken, refreshToken, profile, callback) {
        // console.log(req.user);
        // console.log(profile);
        // var facebookUsername = profile.username;
        var facebookName = profile.name; // Dictionary with structure: {familyName : "Caboodle", givenName: "Doodle", middleName: undefined}
        var facebookEmail = profile.emails[0].value; // Array

        
        User.findByEmail(facebookEmail, function(err, result) {
            if (!result.length > 0) {
                MongoClient.connect(uri, function(err, client) {
                    const collection = client.db("art-of-guessing").collection("users");
                    collection.insertOne({email:facebookEmail, password:"", salt:"", firstname:facebookName.givenName, lastname:facebookName.familyName}).then(function(result){
                        // something
                    });
                    const collectionStats = client.db("art-of-guessing").collection("user-stats");
                    collectionStats.insertOne({email:facebookEmail,
                                              roundsWon: 0,
                                              roundsPlayed: 0,
                                              gamesWon: 0,
                                              gamesPlayed: 0,
                                              words: {}
                                             }).then(function(result){
                        // something
                    });
                });
            }
        });
        
        req.session.username = facebookEmail;
        // req.session.username = facebookEmails[0];
        // res.setHeader('Set-Cookie', cookie.serialize('email', email, {
        //     path: '/',
        //     maxAge: 60 * 60 * 24 * 7
        // }));
        return callback(null, profile);
    }
));

passport.use(new GoogleStrategy({
        clientID:"180635629804-s9k3fktikglmn06f32u6mpktql5qlhg8.apps.googleusercontent.com",
        clientSecret:"VEvqMnJOZACYEkD2fn1amlcE",
        callbackURL:"https://art-of-guessing.herokuapp.com/google/callback",
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name']
    },
    function(req, accessToken, refreshToken, profile, callback) {
        // console.log(profile);
        // var googleUsername = profile.username;
        var googleName = profile.name; // Dictionary with structure: {familyName : "Caboodle", givenName: "Doodle", middleName: undefined}
        var googleEmail = profile.emails[0].value; // Array

        
        User.findByEmail(googleEmail, function(err, result) {
            if (!result.length > 0) {
                MongoClient.connect(uri, function(err, client) {
                    const collection = client.db("art-of-guessing").collection("users");
                    collection.insertOne({email:googleEmail, password:"", salt:"", firstname:googleName.givenName, lastname:googleName.familyName}).then(function(result){
                        // something
                    });
                    const collectionStats = client.db("art-of-guessing").collection("user-stats");
                    collectionStats.insertOne({email:googleEmail,
                                              roundsWon: 0,
                                              roundsPlayed: 0,
                                              gamesWon: 0,
                                              gamesPlayed: 0,
                                              words: {}
                                             }).then(function(result){
                        // something
                    });
                });
            }
        });
        
        req.session.username = googleEmail;
        return callback(null, profile);
    }
));

passport.serializeUser(function(user, callback){
    callback(null, user);
});

passport.deserializeUser(function(object, callback){
    callback(null, object);
});

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
                    const collectionStats = client.db("art-of-guessing").collection("user-stats");
                    collectionStats.insertOne({email:user.email,
                                              roundsWon: 0,
                                              roundsPlayed: 0,
                                              gamesWon: 0,
                                              gamesPlayed: 0,
                                              words: {}
                                             }).then(function(result){
                        // something
                    });
                });
                res.setHeader('Set-Cookie', cookie.serialize('email', req.session.username, {
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

var getStats = function(req, res, email, callback) {
    User.getStats(email, function(err, result) {
        console.log(email);
        if (err || result.length < 1) return res.status(404).json("stats corupt");
        else return res.json(result[0]);
    });
}

var getFirstName = function(req, res, email, callback) {
    User.findByEmail(email, function(err, result) {
        console.log(email);
        if (err || result.length < 1) return res.status(404).json("stats corupt");
        else return res.json(result[0].firstname);
    });
}

function init(app) {

    app.use(passport.initialize());
    app.use(passport.session());

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

    // retrieve
    
    app.get('/signout/', function(req, res, next){
        logout(req, res, function(err, success) {
            if (success) res.redirect('/');
            else res.redirect('/login');
        });
    });

    app.get('/login/', authenticateMiddleware, function(req, res, next){
        //res.sendFile(config.filepath + '/');
        res.redirect('/');
    });

    app.get('/profile/', authenticateMiddleware, function(req, res, next){
        res.sendFile(config.filepath + 'profile/profile.html');
    });

    app.get('/stats/:email', authenticateMiddleware, function(req, res, next){
        return getStats(req, res, req.params.email);
    });
    
    app.get('/firstname/:email', function(req, res, next){
        return getFirstName(req, res, req.params.email);
    });

    app.get('/login/facebook', passport.authenticate('facebook', {scope: ['email']}));

    app.get('/login/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login', successRedirect: '/'}));

    app.get('/login/google', passport.authenticate('google', {scope: ['email']}));

    app.get('/login/google/callback', passport.authenticate('google', {failureRedirect: '/login', successRedirect: '/'}));

    // update

    // delete
}


module.exports = {init: init};