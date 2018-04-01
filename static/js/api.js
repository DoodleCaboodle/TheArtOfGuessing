//TO DO
var api = (function(){
    "use strict";
    
    function send(method, url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "] " + xhr.responseText, null);
            else{ 
                try{
                    callback(null, JSON.parse(xhr.responseText));
                }
                catch(err) {
                    callback(null, "");
                }
            }
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }
    
    var module = {};
    
    module.getCurrentUser = function(callback){
        send("GET", "/user/", null, callback);
    };
    
    module.getName = function(callback) {
        send("GET", "/firstname/", null, callback);
    };

    module.getLastName = function(callback) {
        send("GET", "/lastname/", null, callback);
    };
    
    module.signin = function (email, password, callback){
        send("POST", "/signin/", {email: email, password: password}, callback);
    };
    
    module.signup = function (email, password, firstname, lastname, callback){
        send("POST", "/signup/", {email: email, password: password, firstname:firstname, lastname:lastname}, callback);
    };
    
    module.logout = function (callback){
        send("POST", "/signout/", {}, callback);
    };

    module.getStats = function(email, callback) {
        send("GET", "/stats/"+email, null, callback);
    };

    module.updateUser = function(email, pass, fname, lname, callback) {
        console.log({email:email, pass:pass, firstname:fname, lastname:lname});
        send("POST", "/user/", {email:email, pass:pass, firstname:fname, lastname:lname}, callback);
    };
    
    return module;
})();