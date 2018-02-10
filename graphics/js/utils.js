'use strict';

// Converts milliseconds to a time string.
function msToTime(duration) {
	var seconds = parseInt((duration/1000)%60),
		minutes = parseInt((duration/(1000*60))%60),
		hours = parseInt((duration/(1000*60*60))%24);
	
	hours = (hours < 10) ? '0' + hours : hours;
	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;
	
	return hours + ':' + minutes + ':' + seconds;
}

// Goes through each team and members and makes a string to show the names correctly together.
function formPlayerNamesString(runData) {
	var namesArray = [];
	var namesList = 'No Runner(s)';
	runData.teams.forEach(team => {
		var teamMemberArray = [];
		team.members.forEach(member => {teamMemberArray.push(member.names.international);});
		namesArray.push(teamMemberArray.join(', '));
	});
	namesList = namesArray.join(' vs. ');
	return namesList;
}

// Find array index of current run based on it's ID.
function findIndexInRunDataArray(run, runDataArray) {
	var indexOfRun = -1;
	
	// Completely skips this if the run variable isn't defined.
	if (run) {
		for (var i = 0; i < runDataArray.length; i++) {
			if (run.runID === runDataArray[i].runID) {
				indexOfRun = i; break;
			}
		}
	}
	
	return indexOfRun;
}