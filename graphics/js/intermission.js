'use strict';
$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var comingUpRunsBox = $('#comingUpRunsWrapper');
	var musicTickerText = $('#musicTickerText');
	
	// Declaring other variables.
	var isOBS = (window.obsstudio) ? true : false;
	var init = false;
	var nextRuns = []; // Can be 4 or less depending where we are in the schedule.
	var refreshingNextRunsData = false;
	var refreshingNextRunsDisplay = false;
	var songMarquee;

	// This might have race condition issues, not the best, will see how it goes.
	var runContainerElement = $('<div>').load('js/intermission-upcoming-box.html');
	
	// If this is being viewed in OBS Studio, stuff in here can be triggered.
	if (isOBS) {
		// When we change to/away from a scene.
		window.obsstudio.onVisibilityChange = function(active) {
			if (active)
				refreshNextRunsDisplay();
		};
	}
	
	var runDataArray = nodecg.Replicant('runDataArray', speedcontrolBundle);
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	runDataActiveRun.on('change', (newVal, oldVal) => {
		if (!init) {
			init = true;
			refreshNextRunsData();
			refreshNextRunsDisplay();
		}
	});
	
	// (As of writing) triggered from a dashboard button and also when a run's timer ends
	nodecg.listenFor('forceRefreshIntermission', speedcontrolBundle, () => {
		refreshNextRunsData();
		if (!isOBS) refreshNextRunsDisplay();
	});
	
	var songData = nodecg.Replicant('songData', {defaultValue: 'No Track Playing/No Data Available'});
	songData.on('change', newVal => {
		animationSetField(musicTickerText, newVal, () => {
			// Destroy old marquee if it existed.
			if (songMarquee) songMarquee.marquee('destroy');
			
			// See if this needs a marquee effect to show the whole song name.
			var songWidth = getSongDataWidth(newVal);
			if (musicTickerText.width() <= songWidth) {
				var duration = songWidth*12;
				var startDelay = 3000;
				songMarquee = musicTickerText.bind('finished', () => {
					// Pauses the marquee on each cycle.
					// There seems to be an in built option for this, but it doesn't work.
					songMarquee.marquee('pause');
					setTimeout(() => songMarquee.marquee('resume'), startDelay);
				}).marquee({
					'duration': duration,
					'startVisible': true,
					'duplicated': true,
					'gap': 100,
					'delayBeforeStart': startDelay
				});
			}
			else songMarquee = undefined;
		});
	});
	
	// Used to get the width of supplied text for the music ticker.
	function getSongDataWidth(text) {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		ctx.font = '26px Montserrat'; /* Change if layout is changed. */
		return ctx.measureText(text).width;
	}
	
	// Refresh the data about the upcoming runs (up to 4 runs).
	function refreshNextRunsData() {
		// Checks if the run data array is actually imported yet by checking if it's an array.
		if ($.isArray(runDataArray.value) && !refreshingNextRunsData) {
			refreshingNextRunsData = true;
			var indexOfCurrentRun = findIndexInRunDataArray(runDataActiveRun.value, runDataArray.value);
			nextRuns = [];
			for (var i = 1; i <= 4; i++) {
				if (!runDataArray.value[indexOfCurrentRun+i]) break;
				nextRuns.push(runDataArray.value[indexOfCurrentRun+i]);
			}
			refreshingNextRunsData = false;
		}
	}
	
	// Actually update the layout to show the runs that were updated in the above function.
	// This is a separate function because sometimes we don't want to do both at the same time.
	function refreshNextRunsDisplay() {
		if (!refreshingNextRunsDisplay) {
			refreshingNextRunsDisplay = true;
			var newHTML = '';
			var whenTotal = 0; // Totals all the estimates for calculating the "in about X" lines.
			
			// Loop through all the runs to create their HTML.
			for (var i = 0; i < nextRuns.length; i++) {
				// Stuff for the string that appears at the time with an ETA.
				var whenString = '';
				if (i === 0) whenString = 'Next';
				else {
					var previousRunTime = nextRuns[i-1].estimateS + nextRuns[i-1].setupTimeS;
					var formatted = moment.utc().second(0).to(moment.utc().second(whenTotal+previousRunTime), true);
					whenString = 'In about '+formatted;
					whenTotal += previousRunTime;
				}
				
				var players = formPlayerNamesString(nextRuns[i]);
				
				// Dirty hack to show co-op icon if the first team is configured to show it.
				var showTeamIcon = nextRuns[i].teams[0] && nextRuns[i].teams[0].members.length > 1;
				
				// Insert the data into a copy of the container element.
				var containerCopy = runContainerElement;
				$('.gameWhen', containerCopy).html(whenString);
				$('.gameTitle', containerCopy).html(nextRuns[i].game);
				$('.gameCategory', containerCopy).html(nextRuns[i].category);
				$('.gameConsole', containerCopy).html(nextRuns[i].system);
				$('.gamePlayers span', containerCopy).html(players);
				if (!showTeamIcon) $('.gamePlayers .playerCoOp', containerCopy).hide();
				
				newHTML += containerCopy.html();
			}
			
			animationSetField(comingUpRunsBox, newHTML, () => {
				refreshingNextRunsDisplay = false;
			});
		}
	}
});