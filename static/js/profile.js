(function() {
    "use strict";
    var user = "";
    var firstName = "";
    var lastName = "";
    api.getCurrentUser(function(err, result) {
        if (err || !result) window.location.href = "/login";
        else {
            user = result;
            if (!user || user === '') {
                window.location.href = '/login';
            } else {
                api.getName(function(err, name) {
                    if (err) console.log(err);
                    else {
                        firstName = name;
                        loadWindow();
                        document.getElementById("loading").classList.add('slide-up');
                        Array.prototype.forEach.call(document.getElementsByClassName("user"), function(d) {
                            d.innerHTML = firstName;
                        });
                        api.getLastName(function(err, lname) {
                            if (err) console.log(err);
                            else {
                                lastName = lname;
                            }
                        });
                    }
                });
            }
        }
    });

    var loadWindow = function() {

        var h = document.createElement("H1");
        var t = document.createTextNode(firstName);
        h.appendChild(t);
        document.getElementById("mainInfo").appendChild(h);
        console.log(user);
        api.getStats(user, function(err, res) {
            if (err) console.log(err);
            else {
                var gamesWon = res.gamesWon;
                var gamesLost = res.gamesPlayed - res.gamesWon;
                var gameStatsConfig = {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [
                                gamesWon,
                                gamesLost
                            ],
                            backgroundColor: [
                                "#46BFBD",
                                "#F7464A"
                            ],
                            label: 'Game Stats'
                        }],
                        labels: [
                            "Wins",
                            "Loses"
                        ]
                    },
                    options: {
                        responsive: true,
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Games'
                        },
                        animation: {
                            animateScale: true,
                            animateRotate: true
                        }
                    }
                };
                var ctx = document.getElementById("gameStats").getContext("2d");
                ctx.canvas.width = 180;
                ctx.canvas.height = 180;
                window.myDoughnut = new Chart(ctx, gameStatsConfig);

                var wordsDict = res.words;

                var theWords = Object.keys(wordsDict);

                var tempVals = Object.values(wordsDict);
                var drawn = [];
                var guessed = [];
                for (var i = 0; i < tempVals.length; i++) {
                    drawn.push(tempVals[i].drawn);
                    guessed.push(tempVals[i].guessed);
                }

                var barWordsData = {
                    labels: theWords,
                    datasets: [{
                        label: 'Drawn',
                        backgroundColor: "red",
                        borderColor: "#8B0000",
                        borderWidth: 1,
                        data: drawn
                    }, {
                        label: 'Guessed',
                        backgroundColor: "#87CEFA",
                        borderColor: "#0000FF",
                        borderWidth: 1,
                        data: guessed
                    }]
                };
                ctx = document.getElementById("wordsData").getContext("2d");
                window.myBarChart = new Chart(ctx, {
                    type: 'bar',
                    data: barWordsData,
                    options: {
                        responsive: true,
                        legend: {
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Words'
                        }
                    }
                });

                var roundsWon = res.roundsWon;
                var roundsLost = res.roundsPlayed - res.roundsWon;
                var roundsStatsConfig = {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [
                                roundsWon,
                                roundsLost
                            ],
                            backgroundColor: [
                                "#46BFBD",
                                "#F7464A"
                            ],
                            label: 'Rounds Stats'
                        }],
                        labels: [
                            "Wins",
                            "Loses"
                        ]
                    },
                    options: {
                        responsive: true,
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Rounds'
                        },
                        animation: {
                            animateScale: true,
                            animateRotate: true
                        }
                    }
                };
                ctx = document.getElementById("roundsStats").getContext("2d");
                ctx.canvas.width = 180;
                ctx.canvas.height = 180;
                window.myDoughnut = new Chart(ctx, roundsStatsConfig);
            }
        });

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

        document.getElementById("edit-profile").addEventListener('click', function() {
            document.getElementById("profile-stats").style.display = 'none';
            document.getElementById("edit-profile-container").style.display = 'flex';
            document.getElementById("profile-email").value = user;
            document.getElementById("profile-pass").value = "";
            document.getElementById("profile-first-name").value = firstName;
            document.getElementById("profile-last-name").value = lastName;
        });

        document.getElementById("profile-cancel").addEventListener("click", function() {
            document.getElementById("profile-stats").style.display = 'flex';
            document.getElementById("edit-profile-container").style.display = 'none';
            document.getElementById("profile-email").value = "";
            document.getElementById("profile-pass").value = "";
            document.getElementById("profile-first-name").value = "";
            document.getElementById("profile-last-name").value = "";
        });

        document.getElementById("edit-profile-container").addEventListener("submit", function(){
            var email = document.getElementById("profile-email").value;
            var pass = document.getElementById("profile-pass").value;
            var fname = document.getElementById("profile-first-name").value;
            var lname = document.getElementById("profile-last-name").value;

            api.updateUser(email, pass, fname, lname, function(err, result) {
                if (err) console.log(err);
                else {
                    user = email;
                    firstName = fname;
                    lastName = lname;
                    document.getElementById("profile-stats").style.display = "flex";
                    document.getElementById("edit-profile-container").style.display = "none";

                    document.getElementById("profile-email").value = "";
                    document.getElementById("profile-pass").value = "";
                    document.getElementById("profile-first-name").value = "";
                    document.getElementById("profile-last-name").value = "";
                    swal("Success!", "Your profile has been updated!", "success");
                }
            });            
        });
    };
}());