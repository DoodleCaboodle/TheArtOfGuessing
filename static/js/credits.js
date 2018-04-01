(function(){
    "user strict";

    window.onload = function() {
        var logoutFunc = function() {
            window.location.href = "/signout";
        };

        var homeFunc = function() {
            window.location.href = "/";
        };

        var backFunc = function() {
            window.history.back();
        };

        var nextFunc = function() {
            window.history.forward();
        };

        if (annyang) {
            var commands = {
                'logout': logoutFunc,
                'log out': logoutFunc,
                'sign out': logoutFunc,
                'signout': logoutFunc,
                'home': homeFunc,
                'back': backFunc,
                'next': nextFunc,
                'forward': nextFunc,
                'help me': function() {
                    document.getElementById('overlay').style.display = "flex";
                },
                'thank you': function() {
                    document.getElementById('overlay').style.display = "none";
                }
            };

            annyang.addCommands(commands);
            annyang.start();
            document.getElementById('pauseVoice').style.display = "flex";
        } else {
            //CHANGE THE CONTENT OF THE VOICE COMMANDS PART HERE
            document.getElementById('voiceCommands').innerHTML = "Sorry, your browser does not support speech recognition. If you want to use this feature, try to use Chrome instead.";
        }

        document.getElementById("helpButton").addEventListener('click', function(){
            document.getElementById('overlay').style.display = "flex";
        });

        document.getElementById("close_help").addEventListener('click', function() {
            document.getElementById('overlay').style.display = "none";
        });

        var pauseVoice = function() {
            annyang.pause();
            document.getElementById('pauseVoice').style.display = "none";
            document.getElementById('resumeVoice').style.display = "flex";
        };

        var resumeVoice = function() {
            annyang.resume();
            document.getElementById('pauseVoice').style.display = "flex";
            document.getElementById('resumeVoice').style.display = "none";
        };

        document.getElementById('pauseVoice').addEventListener('click', function() {
            pauseVoice();
        });

        document.getElementById('resumeVoice').addEventListener('click', function() {
            resumeVoice();
        });
    }
}());