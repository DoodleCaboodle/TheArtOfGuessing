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
                            ).then(function(result){});
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

User.getStats = function(email, callback) {
    MongoClient.connect(uri, function(err, client) {
        const collection = client.db("art-of-guessing").collection("user-stats");
        
        collection.find({email:email}).toArray(function(err, result) {
            if (err) callback(err, null);
            callback(null, result);
            client.close();
        });
    });
}

User.updateStats = function(email, roundsWon, roundsPlayed, gamesWon, gamesPlayed, newWords) {
    User.getStats(email, function(err, result) {
        if (err) console.log(err);
        else {
            var mergedWords = result[0].words;
            for (var key in newWords) {
                if (key in mergedWords) {
                    mergedWords[key].drawn += newWords[key].drawn;
                    mergedWords[key].guessed += newWords[key].guessed;
                }
                else {
                    mergedWords[key] = newWords[key];
                }
            }
            
            MongoClient.connect(uri, function(err, client) {
                const collection = client.db("art-of-guessing").collection("user-stats");
                collection.updateOne({email:email},
                                     {$set: {email:email,
                                             roundsWon: result[0].roundsWon + roundsWon,
                                             roundsPlayed: result[0].roundsPlayed + roundsPlayed,
                                             gamesWon: result[0].gamesWon + gamesWon,
                                             gamesPlayed: result[0].gamesPlayed + gamesPlayed,
                                             words: mergedWords
                                            },
                                     $currentDate: { lastModified: true } }
                                    ).then(function(result){});
            });
        }
    });
}

module.exports = User;