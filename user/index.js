const bcrypt = require('bcrypt');
const User = require('../user');
const config = require('../config.js');

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

var authenticate = function(req, email, pass, callback) {
    User.findByEmail(email, function(err, result){
        if (err) callback(err, null);
        if (result.email === email && bcrypt.compareSync(pass, email.password)) {
            req.session.username = email;
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    });
}

var register = function(req, user, callback) {
    if (!user) callback(null, false);
    else {
        req.session.username = user.email;
        callback(null, true);
    }
}

var logout = function(req, callback) {
    req.session.username = '';
    callback(null, true);
}

function init(app) {
    // create
    
    app.post('/signin/', function(req, res, next) {
        console.log('signin');
        var email = req.body.email;
        var pass = req.body.password;
        athenticate(req, email, pass, function(err, success) {
            if (err) console.log(err);
            if (success) res.redirect('/profile');
            res.redirect('/login');
        });
    });
    
    app.post('/singup/', function(req, res, next){
        console.log("singup");
        var salt = auth.getSalt();
        var hash = getSaltedHash(req.body.password, salt);
        var newUser = new User(req.body.email, hash, salt, req.body.firstname, req.body.lastname);
        register(req, newUser, function(err, success) {
            if (err) console.log(err);
            if (success) res.redirect('/profile');
            res.redirect('/login');
        });
    });

    app.post('/signout/', function(req, res, next){
        logout(req, function(err, success) {
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