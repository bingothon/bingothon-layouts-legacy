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
	
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	runDataActiveRun.on('change', (newVal, oldVal) => {
		console.log(newVal);
		if (newVal) updateSceneFields(newVal);
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