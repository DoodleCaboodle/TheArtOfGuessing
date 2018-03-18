(function(){
	"use strict";

	var user = api.getCurrentUser();

	api.getStats(user, function(err, res){
		if (err) console.log(err)
		console.log(res);
	});
}());