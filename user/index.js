const bcrypt = require('bcrypt');
const cookie = require('cookie');
const User = require('./user');
const config = require('../config.js');
const connectEnsureLogin = require('connect-ensure-login');

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

var MongoClient = require('mongodb').MongoClient;
var uri = config.uri;

passport.use(new FacebookStrategy({
        clientID: "605074963161695",
        clientSecret: "0913f6785932df1be87fbe9a35",
        callbackURL: "https://art-of-guessing.herokuapp.com/login/facebook/return"
    },
    function(accessToken, refreshToken, profile, callback) {
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
        res.sendFile(config.filepath + 'profile/profile.html');
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

    app.get('/login/facebook', passport.authenticate('facebook'));

    app.get('/login/facebook/return', passport.authenticate('facebook', {failureRedirect: '/login'}), function(req, res) {
        res.redirect('/profile/facebook');
    });

    app.get('profile/facebook', connectEnsureLogin.ensureLoggedIn(), function(req, res){
        console.log(req.user);
    });

    // update

    // delete
}


module.exports = {init: init};