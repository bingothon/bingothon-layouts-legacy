'use strict';

// Get the next X runs in the schedule.
function getNextRuns(runData, runDataArray, amount) {
	var nextRuns = [];
	var indexOfCurrentRun = findIndexInRunDataArray(runData, runDataArray);
	for (var i = 1; i <= amount; i++) {
		if (!runDataArray[indexOfCurrentRun+i]) break;
		nextRuns.push(runDataArray[indexOfCurrentRun+i]);
	}
	return nextRuns;
}

// Returns how long until a run, based on the estimate of the previous run.
function formETAUntilRun(previousRun, whenTotal) {
	var whenString = '';
	if (!previousRun) whenString = 'Next';
	else {
		var previousRunTime = previousRun.estimateS + previousRun.setupTimeS;
		var formatted = moment.utc().second(0).to(moment.utc().second(whenTotal+previousRunTime), true);
		whenString = 'In about '+formatted;
		whenTotal += previousRunTime;
	}
	return [whenString, whenTotal];
}

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