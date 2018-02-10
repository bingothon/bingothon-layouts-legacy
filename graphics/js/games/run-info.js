'use strict';
$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var runInfoContainer = $('#runInfoContainer');
	var gameTitle = $('#gameTitle', runInfoContainer);
	var gameCategory = $('#gameCategory', runInfoContainer);
	var gameConsole = $('#gameConsole', runInfoContainer);
	var gameEstimate = $('#timerContainer #gameEstimate');
	var timerText = $('#timerContainer #timer');
	
	// Declaring other variables.
	var runDataActiveRunCache = {};
	
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	runDataActiveRun.on('change', (newVal, oldVal) => {
		if (newVal) {
			// Dumb comparison to stop the data refreshing if the server restarts.
			if (JSON.stringify(newVal) !== JSON.stringify(runDataActiveRunCache)) {
				updateSceneFields(newVal);
				runDataActiveRunCache = newVal;
			}
		}
		else animationSetField(gameTitle, 'The Beginning');
	});
	
	// Sets information on the layout for the run.
	function updateSceneFields(runData) {
		animationSetField(gameTitle, runData.game);
		animationSetField(gameCategory, runData.category);
		animationSetField(gameConsole, runData.system);
		animationSetField(gameEstimate, runData.estimate);
		animationSetField(timerText); // Fade out/in the timer as well.
	}
});