(function(){
	"use strict";

	window.onload = function() {

		var user = api.getCurrentUser();

		var h = document.createElement("H1");
		var t = document.createTextNode(user.split('%40')[0]);
		h.appendChild(t);
		document.getElementById("mainInfo").appendChild(h);

		api.getStats(user, function(err, res){
			if (err) console.log(err)
			var gamesWon = res.gamesWon;
			var gamesLost = res.gamesPlayed - res.gamesWon;
			var gameStatsConfig = {
				type:'doughnut',
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
			}
			var ctx = document.getElementById("gameStats").getContext("2d");
			ctx.canvas.width = 180;
			ctx.canvas.height = 180;
			window.myDoughnut = new Chart(ctx, gameStatsConfig);

			var wordsDict = res.words;

			var theWords = Object.keys(wordsDict);

			var tempVals = Object.values(wordsDict);
			var drawn = [];
			var guessed = [];
			for(var i = 0; i < tempVals.length; i++) {
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
			}
			var ctx = document.getElementById("wordsData").getContext("2d");
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
				type:'doughnut',
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
			}
			var ctx = document.getElementById("roundsStats").getContext("2d");
			ctx.canvas.width = 180;
			ctx.canvas.height = 180;
			window.myDoughnut = new Chart(ctx, roundsStatsConfig);
		});

		var logoutFunc = function() {
        	window.location.href = "/signout";
        }

        var homeFunc = function() {
        	window.location.href = "/";
        }

        var backFunc = function() {
        	window.history.back();
        }

        var nextFunc = function() {
        	window.history.forward();
        }

		if (annyang) {
        	var commands = {
        		'logout': logoutFunc,
        		'log out': logoutFunc,
        		'sign out': logoutFunc,
        		'signout': logoutFunc,
        		'home': homeFunc,
        		'back': backFunc,
        		'next': nextFunc,
        		'forward': nextFunc
        	};

        	annyang.addCommands(commands);
        	annyang.start();
        	document.getElementById('pauseVoice').style.display = "flex";
        }

        var pauseVoice = function() {
            annyang.pause();
            document.getElementById('pauseVoice').style.display = "none";
            document.getElementById('resumeVoice').style.display = "flex";
        }

        var resumeVoice = function() {
            annyang.resume();
            document.getElementById('pauseVoice').style.display = "flex";
            document.getElementById('resumeVoice').style.display = "none";
        }

        document.getElementById('pauseVoice').addEventListener('click', function() {
            pauseVoice();
        });

        document.getElementById('resumeVoice').addEventListener('click', function() {
            resumeVoice();
        });

	}

}());