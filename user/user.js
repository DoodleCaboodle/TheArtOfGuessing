const config = require('../config.js');

var MongoClient = require('mongodb').MongoClient;
var uri = config.uri;

function User(email, password, salt, firstname, lastname) {
    this.email = email;
    this.password = password;
    this.salt = salt;
    this.firstname = firstname;
    this.lastname = lastname;
}

User.prototype.update = function(oldEmail, email, password, salt, firstname, lastname) {
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