'use strict';

// Current setup for how teams are treated:
// All teams (teams can be just 1 runner) have their own container
// EXCEPT if there is 1 team and they have >1 player.

$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var playerContainers = $('.playerContainer'); // Array
	
	// Declaring other variables.
	var displayNameForOriginal = 45000; // 45 seconds
	var displayTwitchForOriginal = 15000; // 15 seconds
	var displayNameFor;
	var displayTwitchFor;
	var teamMemberIndex = []; // Stores what team member of each team is currently being shown.
	var currentTeamsData = []; // All teams data is stored here for reference when changing.
	var rotationTO; // Stores the timeout used for switching between name and twitch.
	var init = true; // Tracks if this is the first time things are being shown since changing.
	var runDataActiveRunCache = {};
	
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	var soundOnTwitchStream = nodecg.Replicant('sound-on-twitch-stream', 'speedcontrol-bingothon', {defaultValue:-1});
	runDataActiveRun.on('change', (newVal, oldVal) => {
		if (newVal) {
			// Dumb comparison to stop the data refreshing if the server restarts.
			if (JSON.stringify(newVal) !== JSON.stringify(runDataActiveRunCache)) {
				updateSceneFields(newVal);
				runDataActiveRunCache = newVal;
			}
		}
	});

	// add the sound icon (but hidden) to every player container
	playerContainers.each(e=>{
		$('img.playerFlag',e).before('<img class="music-note">');
	});

	// catch where the sound is and make that stream visible (if there are multiple)
	runDataActiveRun.once('change',()=>{
		soundOnTwitchStream.on('change',newVal=>{
			if (runDataActiveRun.value.teams.length <= 0) return;
			playerContainers.find('img.music-note').each((index, element)=>{
				if (index == newVal) {
					$(element).css('opacity',1);
					$(element).css('display',"none");
				} else {
					$(element).css('opacity',0);
					$(element).css('display',"inline");
				}
			});
		});
	});
	
	function updateSceneFields(runData) {
		// Reset important stuff.
		currentTeamsData = [];
		teamMemberIndex = [];
		clearTimeout(rotationTO);
		init = true;
		
		// modified to put each team member in a different name tag cause no onsite 
		// coops in an online event
		runData.teams.forEach(team => {
			team.players.forEach(player => currentTeamsData.push({players: [createPlayerData(player)]}));
		});
		
		// Set up team member indices so we can keep track on what team member is being shown.
		for (var i = 0; i < currentTeamsData.length; i++) {teamMemberIndex[i] = 0;}
		
		// Clean out player containers not needed.
		if (currentTeamsData.length < playerContainers.length) {
			for (var i = currentTeamsData.length; i < playerContainers.length; i++) {
				animationCleanPlayerData(playerContainers[i]);
			}
		}
		
		// If the first team has multiple runners, make the display timers shorter.
		if (currentTeamsData[0] && currentTeamsData[0].players.length > 1) {
			displayNameFor = displayNameForOriginal/2;
			displayTwitchFor = displayTwitchForOriginal/2;
		} else {
			displayNameFor = displayNameForOriginal;
			displayTwitchFor = displayTwitchForOriginal;
		}
		
		showNames();
	}
	
	// Change to showing usernames.
	function showNames() {
		for (var i = 0; i < teamMemberIndex.length; i++) {
			if (!playerContainers[i]) break; // Skip if there's no container for this team.
			var index = teamMemberIndex[i]; // Who the current player is who should be shown in this team.
			
			if (init)
				animationChangePlayerData(playerContainers[i], currentTeamsData[i].players[index], false, true, currentTeamsData[i].showTeamIcon);
			else
				animationChangePlayerData(playerContainers[i], currentTeamsData[i].players[index], false);
		}
		
		// Toggle to false if this was the first time running this function since a change.
		if (init) init = false;
		
		rotationTO = setTimeout(showTwitchs, displayNameFor);
	}
	
	// Change to showing Twitch names.
	function showTwitchs() {
		for (var i = 0; i < teamMemberIndex.length; i++) {
			if (!playerContainers[i]) break; // Skip if there's no container for this team.
			var index = teamMemberIndex[i]; // Who the current player is who should be shown in this team.
			animationChangePlayerData(playerContainers[i], currentTeamsData[i].players[index], true);
		}
		
		rotationTO = setTimeout(rotateTeamMembers, displayTwitchFor);
	}
	
	// Change settings to go to the next team member, if applicable.
	function rotateTeamMembers() {
		for (var i = 0; i < teamMemberIndex.length; i++) {
			teamMemberIndex[i]++;
			
			// If we've reached the end of the team member array, go back to the start.
			if (teamMemberIndex[i] >= currentTeamsData[i].players.length) teamMemberIndex[i] = 0;
		}
		
		showNames();
	}
	
	// Easy access to create member data object used above.
	function createPlayerData(member) {
		// Gets username from URL.
		if (member.twitch && member.twitch.uri) {
			var twitchUsername = member.twitch.uri.split('/');
			twitchUsername = twitchUsername[twitchUsername.length-1];
		}
		
		var memberData = {
			name: member.name,
			twitch: member.social.twitch,
			region: member.country
		};
		
		return memberData;
	}
});