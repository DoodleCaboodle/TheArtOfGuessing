//TO DO
var api = (function(){
    "use strict";
    
    function send(method, url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "] " + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }
    
    var module = {};
    
    module.getCurrentUser = function(){
        var l = document.cookie.split("email=");
        if (l.length > 1) return l[1];
        return null;
    }
    
    module.getName = function(email, callback) {
        console.log(email);
        send("GET", "/firstname/"+email, null, callback);
    }
    
    module.signin = function (email, password, callback){
        send("POST", "/signin/", {email: email, password: password}, callback);
    }
    
    module.signup = function (email, password, firstname, lastname, callback){
        send("POST", "/signup/", {email: email, password: password, firstname:firstname, lastname:lastname}, callback);
    }
    
    module.logout = function (callback){
        send("POST", "/signout/", {}, callback);
    }

    module.getStats = function(email, callback) {
        send("GET", "/stats/"+email, null, callback);
    }
    
    return module;
})();