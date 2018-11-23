'use strict';
$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';

	// Tiltify replicants
	var challengesRep = nodecg.Replicant('tiltifyIncentives', speedcontrolBundle);
	var pollsRep = nodecg.Replicant('tiltifyPolls', speedcontrolBundle);
	
	// JQuery selectors.
	var comingUpRunsBox = $('#comingUpRunsWrapper');
	var comingUpChallengesBox = $('#comingUpChallengesWrapper');
	var comingUpPollsBox = $('#comingUpPollsWrapper');
	var nextUpHeaderText = $('#comingUpRunsHeaderTextSpan');
	comingUpPollsBox.html('nothing here');
	var musicTickerText = $('#musicTickerText');
	var adTimerElement = $('#adTimer');
	
	// Declaring other variables.
	var isOBS = (window.obsstudio) ? true : false;
	var pageInit = false;
	var nextRuns = []; // Can be 4 or less depending where we are in the schedule.
	var nextChallenges = []; // the next 4 challenges that are active and not over
	var refreshingNextRunsData = false;
	var refreshingNextRunsDisplay = false;
	var songMarquee;
	var adTimeout;
	var adTicks = 0;
	var adTime = 180;

	// animation stuff
	const showLengh = 10000; // how long to show the individual containers in ms
	var nextUpCurrent = 0; // which part to display, runs(0), challenges(1), polls(2)

	// When challenges/incentives changes load the next 3 into the cache to display them
	challengesRep.on('change',(newChallenges,old)=>{
		// slice to copy
		// only get the active ones, then the 4 that end next and haven't ended
		nextChallenges = newChallenges.filter(challenge => challenge.active && (challenge.endsAt > Date.now()))
			.sort(function (chA, chB){return chA.endsAt - chB.endsAt})
			.slice(0,4);
		nodecg.log.info(JSON.stringify(nextChallenges));
		refreshChallengesHtml();
	});

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

			// Add a sad message when only less than 3 runs are coming
			if (nextRuns.length < 4) {
				// The emote is BibleThumb
				newHTML += '<div class="storageBox comingUpRunContainer flexContainer">	<div class="gameTitle">It\'s over</div>	<img src="https://static-cdn.jtvnw.net/emoticons/v1/86/3.0"></div>'
			}

			comingUpRunsBox.html(newHTML);
		}
	}

	function refreshChallengesHtml() {
		var newHtml = '';
		for (var i = 0; i < nextChallenges.length; i++) {
			newHtml += '<div class="storageBox comingUpRunContainer flexContainer">';
			newHtml += '<div class="gameTitle">'+nextChallenges[i].name+'</div>';
			newHtml += '<div class="challengeGoal' + (nextChallenges[i].totalAmountRaised>=nextChallenges[i].amount?' goalMet':'') + '">'
				+formatDollarAmount(nextChallenges[i].totalAmountRaised)+'/'+formatDollarAmount(nextChallenges[i].amount)+(nextChallenges[i].totalAmountRaised>=nextChallenges[i].amount?' Goal Met!':'')+'</div>';
			
			newHtml += '</div>';
		}
		comingUpChallengesBox.html(newHtml);
	}

	function refreshPollHtml() {
		var newHtml = '';
		// pick 4 random polls
		// clone array
		var allPolls = pollsRep.value.slice(0);
		var nextPolls = [];
		if (allPolls.length <= 4) {
			nextPolls = allPolls;
		} else {
			for(var i = 0;i<4;i++) {
				var rnd = Math.floor(Math.random()*allPolls.length);
				nextPolls.push(allPolls[rnd]);
				allPolls.splice(rnd, 1);
			}
		}
		for (var i = 0; i < nextPolls.length; i++) {
			newHtml += '<div class="storageBox comingUpRunContainer flexContainer">';
			newHtml += '<div class="gameTitle">'+nextPolls[i].name+'</div>';
			var optionsFormatted = [];
			nextPolls[i].options.forEach(option => {
				optionsFormatted.push(option.name+' ('+formatDollarAmount(option.totalAmountRaised)+')');
			});
			newHtml += '<div class="pollOptions">'+optionsFormatted.join('/')+'</div>';
			newHtml += '</div>';
		}
		comingUpPollsBox.html(newHtml);
	}

	// This function calls itself with a timeout to cycle though the different parts
	function doFadeInFadeOut() {
		// fade in current element
		if (nextUpCurrent == 0) {
			nextUpHeaderText.text('Runs Coming Up Soon')
			animationFadeInElement('#comingUpRunsHeaderTextSpan');
			animationFadeInElement('#comingUpRunsWrapper',()=>{
				nextUpCurrent = 1;
				// first wait and display the current stuff then after the fadeout call this again to show the next one
				setTimeout(()=>{
					// check if there is anything else to fade to
					// otherwise we are most likely at the end of the marathon so lets
					// stop this animation cycle and present the last runs
					// this doesn't account for the edge case where a new poll/challenge pops up
					if (nextChallenges.length > 0|| pollsRep.value.length > 0) {
						animationFadeOutElement('#comingUpRunsHeaderTextSpan');
						animationFadeOutElement('#comingUpRunsWrapper',()=>{
							doFadeInFadeOut();
						});
					}
					
				}, showLengh);
			});
		} else if(nextUpCurrent == 1) {
			nextUpHeaderText.text('Incentives Coming Up Soon')
			nextUpCurrent = 2;
			// if there are no challenges continue
			if (nextChallenges.length <= 0) {
				doFadeInFadeOut();
				return;
			}
			refreshPollHtml();
			animationFadeInElement('#comingUpRunsHeaderTextSpan');
			animationFadeInElement('#comingUpChallengesWrapper',()=>{
				// first wait and display the current stuff then after the fadeout call this again to show the next one
				setTimeout(()=>{
					animationFadeOutElement('#comingUpRunsHeaderTextSpan');
					animationFadeOutElement('#comingUpChallengesWrapper',()=>{
						doFadeInFadeOut();
					});
					
				}, showLengh);
			});
		} else {
			nextUpHeaderText.text('Next Bid Wars')
			nextUpCurrent = 0;
			// if there are no polls continue
			if (pollsRep.value.length <= 0) {
				doFadeInFadeOut();
				return;
			}
			animationFadeInElement('#comingUpRunsHeaderTextSpan');
			animationFadeInElement('#comingUpPollsWrapper',()=>{
				// first wait and display the current stuff then after the fadeout call this again to show the next one
				setTimeout(()=>{
					animationFadeOutElement('#comingUpRunsHeaderTextSpan');
					animationFadeOutElement('#comingUpPollsWrapper',()=>{
						doFadeInFadeOut();
					});
					
				}, showLengh);
			});
		}
	}

	// actually start animation
	doFadeInFadeOut();
});