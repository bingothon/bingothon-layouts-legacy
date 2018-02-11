'use strict';
$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var hostsWrapper = $('#hostsWrapper');
	var extraDataBoxWrapper = $('#extraDataBoxWrapper');
	
	// Declaring other variables.
	var isOBS = (window.obsstudio) ? true : false;
	var pageInit = false;
	var nextRuns = []; // Can be 3 or less depending where we are in the schedule.
	var refreshingNextRunsData = false;
	var extraDataTime = 10000;
	var extraDataTO;
	var hostDisplayStatusChanging = false;
	var hostShowTO;
	
	// If this is being viewed in OBS Studio, stuff in here can be triggered.
	if (isOBS) {
		// When we change to/away from a scene.
		window.obsstudio.onVisibilityChange = function(active) {
			if (active) {
				// Show upcoming games from the start.
				clearTimeout(extraDataTO);
				showUpcomingGame(true);
			}
		};
	}
	
	var runDataArray = nodecg.Replicant('runDataArray', speedcontrolBundle);
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	runDataActiveRun.on('change', (newVal, oldVal) => {
		if (!pageInit) {
			pageInit = true;
			refreshNextRunsData();
			showUpcomingGame();
		}
	});
	
	// (As of writing) triggered from a dashboard button and also when a run's timer ends
	nodecg.listenFor('forceRefreshIntermission', speedcontrolBundle, () => {
		refreshNextRunsData();
	});
	
	// Refresh the data about the upcoming runs (up to 4 runs).
	function refreshNextRunsData() {
		// Checks if the run data array is actually imported yet by checking if it's an array.
		if ($.isArray(runDataArray.value) && !refreshingNextRunsData) {
			refreshingNextRunsData = true;
			nextRuns = getNextRuns(runDataActiveRun.value, runDataArray.value, 3);
			refreshingNextRunsData = false;
		}
	}
	
	var upcomingGameIndex = 0;
	var whenTotal = 0;
	var nextRunsTemp = [];
	function showUpcomingGame(reset) {
		if (reset) {whenTotal = 0; upcomingGameIndex = 0;}
		
		// Temporary copy of the nextRuns array made so forceRefreshIntermission doesn't break it.
		if (upcomingGameIndex === 0)
			nextRunsTemp = nextRuns.slice(0);
		
		var runData = nextRunsTemp[upcomingGameIndex];
		
		// Move straight to music ticker if no games to show.
		if (!runData) {
			showMusicTicker();
			return;
		}
		
		// Stuff for the string that appears at the time with an ETA.
		var whenString = formETAUntilRun(nextRunsTemp[upcomingGameIndex-1], whenTotal)[0];
		whenTotal = formETAUntilRun(nextRunsTemp[upcomingGameIndex-1], whenTotal)[1];
		
		// Make element that has the run information in it.
		var container = $('<div>');
		container.append('<div id="extraDataHeader" class="flexContainer">');
		$('#extraDataHeader', container).html(whenString);
		container.append('<div id="extraDataContent">');
		var content = runData.game+' ('+runData.category+') by '+formPlayerNamesString(runData);
		$('#extraDataContent', container).html(content);
		
		animationSetField(extraDataBoxWrapper, container.html(), () => {
			upcomingGameIndex++;
			
			// If there's no more games to show, move to the music ticker.
			if (upcomingGameIndex >= nextRunsTemp.length)
				extraDataTO = setTimeout(showMusicTicker, extraDataTime);
			else extraDataTO = setTimeout(showUpcomingGame, extraDataTime);
		});
		
	}
	
	// Song name is the data of the song playing when displayed, does not change while on screen.
	var songData = nodecg.Replicant('songData');
	function showMusicTicker() {
		// If no song is playing, skip this.
		if (!songData.value.playing) {
			showUpcomingGame(true);
			return;
		}
		
		// Make element that has the music information in it.
		var container = $('<div>');
		container.append('<img class="mcat">');
		container.append('<div id="extraDataContent">');
		$('#extraDataContent', container).html(songData.value.title);
		
		animationSetField(extraDataBoxWrapper, container.html(), () => {
			extraDataTO = setTimeout(() => showUpcomingGame(true), extraDataTime)
		});
	}
	
	var hostData = nodecg.Replicant('hostData');
	hostData.on('change', () => {
		// If host data changes and we are showing them, refreshes the data on screen.
		if (hostDisplayStatus.value)
			hideHosts(() =>	showHosts());
	});
	
	// Set the host display status to false/off on page load.
	var hostDisplayInit = false;
	var hostDisplayStatus = nodecg.Replicant('hostDisplayStatus');
	hostDisplayStatus.on('change', () => {
		if (!hostDisplayInit) {
			hostDisplayStatus.value = false;
			hostDisplayInit = true;
		}
	});
	
	// Turn on host display.
	nodecg.listenFor('showHosts', () => {
		if (!hostDisplayStatusChanging && !hostDisplayStatus.value) {
			clearTimeout(hostShowTO);
			showHosts();
		}
	});
	
	// Temporarily turn on host display for 30s.
	nodecg.listenFor('showHostsTemp', () => {
		if (!hostDisplayStatusChanging) {
			hostShowTO = setTimeout(hideHosts, 30000);
			if (!hostDisplayStatus.value) showHosts();
		}
	});	
	
	// Turn off host display.
	nodecg.listenFor('hideHosts', function() {
		if (!hostDisplayStatusChanging && hostDisplayStatus.value)
			hideHosts();
	});
	
	// Show the hosts on screen.
	function showHosts(callback) {
		hostDisplayStatusChanging = true;
		hostDisplayStatus.value = true;
		hostsWrapper.html('');
		hostData.value.forEach(user => hostsWrapper.append(createHostContainer(user)));
		animationFadeInElement(hostsWrapper, () => {
			hostDisplayStatusChanging = false;
			if (callback) callback();
		});
	}
	
	// Hide the hosts on screen.
	function hideHosts(callback) {
		hostDisplayStatusChanging = true;
		hostDisplayStatus.value = false;
		clearTimeout(hostShowTO);
		animationFadeOutElement(hostsWrapper, () => {
			hostDisplayStatusChanging = false;
			if (callback) callback();
		});
	}
	
	// Creates the host element top be inserted.
	function createHostContainer(hostData) {
		var container = $('<div class="playerContainer flexContainer">');
		container.append('<div class="playerText">');
		container.append('<img class="playerFlag">');
		
		$('.playerText', container).html(hostData.name);
				
		// If the host data has a location set, will show their flag too.
		if (hostData.region) {
			var flagURL = 'https://www.speedrun.com/images/flags/'+hostData.region.toLowerCase()+'.png';
			$('.playerFlag', container).attr('src', flagURL);
			$('.playerFlag', container).on('error', e => $(e.target).hide()); // Hides flag if error loading.
		}
		else $('.playerFlag', container).hide();
		
		return container;
	}
});