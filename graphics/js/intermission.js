'use strict';
$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var comingUpRunsBox = $('#comingUpRunsWrapper');
	var musicTickerText = $('#musicTickerText');
	var adTimerElement = $('#adTimer');
	
	// Declaring other variables.
	var isOBS = (window.obsstudio) ? true : false;
	var pageInit = false;
	var nextRuns = []; // Can be 4 or less depending where we are in the schedule.
	var refreshingNextRunsData = false;
	var refreshingNextRunsDisplay = false;
	var songMarquee;
	var adTimeout;
	var adTicks = 0;
	var adTime = 180;

	// This might have race condition issues, not the best, will see how it goes.
	var runContainerElement = $('<div>').load('js/intermission-upcoming-box.html');
	
	// If this is being viewed in OBS Studio, stuff in here can be triggered.
	if (isOBS) {
		// When we change to any scene, so we need to check it's relevant.
		window.addEventListener('obsSceneChanged', function(evt) {
			// Check if this layout can run adverts.
			var sceneName = evt.detail.name;
			if (sceneName.indexOf('(ads)') >= 0) {
				nodecg.sendMessageToBundle('playTwitchAd', 'nodecg-speedcontrol', err => {
					if (!err)
						showAdTimer(true);
				});
			}
		});
		
		// When we change to/away from a scene with this page in it.
		window.obsstudio.onActiveChange = function(active) {
			if (active)
				refreshNextRunsDisplay();
		};
	}
	
	// Logic to update the timer for how long the ads have left after being triggered.
	function showAdTimer(firstTime) {
		if (firstTime) {
			adTicks = 0;
			clearTimeout(adTimeout);
			adTimerElement.css('opacity', '1');
		}
		else if (adTicks > adTime) {
			clearTimeout(adTimeout);
			adTimerElement.css('opacity', '0');
			return;
		}
		
		adTimerElement.html(msToTime((adTime-adTicks)*1000, true));
		adTicks++;
		adTimeout = setTimeout(() => showAdTimer(false), 1000);
	}
	
	var runDataArray = nodecg.Replicant('runDataArray', speedcontrolBundle);
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	runDataActiveRun.on('change', (newVal, oldVal) => {
		if (!pageInit) {
			pageInit = true;
			refreshNextRunsData();
			refreshNextRunsDisplay();
		}
	});
	
	// (As of writing) triggered from a dashboard button and also when a run's timer ends
	nodecg.listenFor('forceRefreshIntermission', speedcontrolBundle, () => {
		refreshNextRunsData();
		if (!isOBS) refreshNextRunsDisplay();
	});
	
	var songData = nodecg.Replicant('songData');
	songData.on('change', (newVal, oldVal) => {
		// If the title didn't change, don't do anything.
		if (oldVal && newVal.title === oldVal.title)
			return;
		
		animationSetField(musicTickerText, newVal.title, () => {
			// Destroy old marquee if it existed.
			if (songMarquee) songMarquee.marquee('destroy');
			
			// See if this needs a marquee effect to show the whole song name.
			var songWidth = getTextWidth(newVal.title, 26);
			if (musicTickerText.width() <= songWidth) {
				var startDelay = 3000;
				songMarquee = musicTickerText.bind('finished', () => {
					// Pauses the marquee on each cycle.
					// There seems to be an in built option for this, but it doesn't work.
					songMarquee.marquee('pause');
					setTimeout(() => songMarquee.marquee('resume'), startDelay);
				}).marquee({
					'speed': 80,
					'startVisible': true,
					'duplicated': true,
					'gap': 100,
					'delayBeforeStart': startDelay
				});
			}
			else songMarquee = undefined;
		});
	});
	
	// Refresh the data about the upcoming runs (up to 4 runs).
	function refreshNextRunsData() {
		// Checks if the run data array is actually imported yet by checking if it's an array.
		if ($.isArray(runDataArray.value) && !refreshingNextRunsData) {
			refreshingNextRunsData = true;
			nextRuns = getNextRuns(runDataActiveRun.value, 4);
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
				var whenString = formETAUntilRun(nextRuns[i-1], whenTotal)[0];
				whenTotal = formETAUntilRun(nextRuns[i-1], whenTotal)[1];
				
				// Player Name(s)
				var players = formPlayerNamesString(nextRuns[i]);
				
				// Dirty hack to show co-op icon if the first team is configured to show it.
				var showTeamIcon = nextRuns[i].teams[0] && nextRuns[i].teams[0].members.length > 1;
				
				// Insert the data into a copy of the container element.
				var containerCopy = runContainerElement.clone();
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