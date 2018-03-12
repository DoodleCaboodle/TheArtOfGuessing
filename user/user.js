const passport = require('passport');

var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://user-01:user-01@art-of-guessing-gdqip.mongodb.net/art-of-guessing";

var User = function (email, password, salt, firstname, lastname) {
    this.email = email;
    this.password = password;
    this.salt = salt;
    this.firstname = firstname;
    this.lastname = lastname;
    MongoClient.connect(uri, function(err, client) {
        const collection = client.db("art-of-guessing").collection("users");
        collection.insertOne({email:email, password:password, firstname:firstname, lastname:lastname}).then(function(result){
            // something
        });
    });
}

User.prototype.update = function(email, password, salt, firstname, lastname) {
    var oldEmail = this.email;
    this.email = email;
    this.password = password;
    this.salt = salt;
    this.firstname = firstname;
    this.lastname = lastname;
    MongoClient.connect(uri, function(err, client) {
        const collection = client.db("art-of-guessing").collection("users");
        collection.updateOne({email:oldEmail},
                             {$set: {email:email, password:password, salt:salt, firstname:firstname, lastname:lastname},
                             $currentDate: { lastModified: true } }
                            ).then(function(result){
            
        });
    });
}

User.findByEmail = function(email, callback) {
    MongoClient.connect(uri, function(err, client) {
        const collection = client.db("art-of-guessing").collection("users");
        
        collection.find({email:email}).toArray(function(err, result) {
            if (err) callback(err, null);
            callback(null, result);
            client.close();
        });
    });
}

module.exports = User;