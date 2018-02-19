'use strict';
$(() => {
	var hostElement = $('<input class="hostName" placeholder="Host Name">');
	var hostNamesContainer = $('#hostNamesContainer');
	
	var hostData = nodecg.Replicant('hostData');
	hostData.on('change', (newVal) => {
		hostNamesContainer.html('');
		
		// Put in a blank box if no hosts to put in.
		if (newVal.length === 0)
			hostElement.clone().appendTo(hostNamesContainer);
		
		else {
			newVal.forEach(hostData => {
				var newHostElement = hostElement.clone();
				newHostElement.val(hostData.name);
				hostNamesContainer.append(newHostElement);
				if (hostData.region) {
					var flagElement = $('<img class="flag">');
					var flagURL = 'https://www.speedrun.com/images/flags/'+hostData.region.toLowerCase()+'.png';
					flagElement.attr('src', flagURL); // set flag image
					flagElement.css('display', 'inline'); // unhide flags
					hostNamesContainer.append(flagElement);
				}
			});
		}
	});
	
	// Add a new blank field for more hosts.
	$('#addHost').click(function(event) {
		var newHostElement = hostElement.clone();
		hostNamesContainer.append(newHostElement);
	});
	
	// Submit changes made to hosts.
	$('#hostsForm').submit(function(event) {
		event.preventDefault();
		var inputs = $('#hostNamesContainer .hostName').toArray();
		
		var newHostData = [];
		
		$('input').attr('disabled','disabled');
		$('input').css('opacity',0.5);
		$('.flag').css('opacity',0.5);
		
		async.eachSeries(inputs, function(user, callback) {
			user = $(user).val();
			
			// Allow people to specify regions manually in the format USER#REGION
			var regexMatch = user.match(/(.*)#([0-9a-zA-Z]+)/);
			
			// Ignore boxes that are blank.
			if (user === '') callback();
			
			else if (regexMatch) {
				var name = regexMatch[1];
				var region = regexMatch[2]; // region really needs checking but is hard to
				
				var hostDataObj = {name: name, region: region};
				newHostData.push(hostDataObj);
				callback();
			}
			
			else {
				var hostDataObj = {name: user};
				getUserDataFromSpeedrunCom(user, function(username, regionCode) {
					if (username) hostDataObj.name = username;
					if (regionCode) hostDataObj.region = regionCode;
					newHostData.push(hostDataObj);
					
					callback();
				});
			}
		}, function(err) {
			$('input').removeAttr('disabled');
			$('input').css('opacity',1);
			$('.flag').css('opacity',1);
			hostData.value = newHostData;
			console.log(newHostData);
		});
	});
	
	// Tries to find the specified user on speedrun.com and get their country/region.
	// Only using username lookups for now, need to use both in case 1 doesn't work.
	function getUserDataFromSpeedrunCom(username, callback) {
		var foundName;
		var foundRegion;
		
		async.waterfall([
			function(callback) {
				if (username) {
					var url = 'https://www.speedrun.com/api/v1/users?max=1&lookup='+username.toLowerCase();
					querySRComForUserData(url, function(name, regionCode) {
						if (name) foundName = name;
						if (regionCode) foundRegion = regionCode;
						callback();
					});
				}
				
				else callback();
			}
		], function(err, result) {
			callback(foundName, foundRegion);
		});
	}
	
	// Helper function for the function above.
	function querySRComForUserData(url, callback) {
		var foundName;
		var foundRegion;
		
		$.ajax({
			url: url,
			dataType: "jsonp",
			success: function(data) {
				if (data.data.length > 0) {
					foundName = data.data[0].names.international;
					
					if (data.data[0].location) {
						foundRegion = data.data[0].location.country.code;
					}
				}
				
				callback(foundName, foundRegion);
			}
		});
	}
});