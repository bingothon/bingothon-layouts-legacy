'use strict';

// Current setup for how teams are treated:
// All teams (teams can be just 1 runner) have their own container
// EXCEPT if there is 1 team and they have >1 player.

$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var playerContainers = $('.playerContainer'); // Array
	
	var dnd = ($('html').attr('data-sceneid') === 'dnd-names') ? true : false;
	
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
	runDataActiveRun.on('change', (newVal, oldVal) => {
		if (newVal) {
			// Dumb comparison to stop the data refreshing if the server restarts.
			if (JSON.stringify(newVal) !== JSON.stringify(runDataActiveRunCache)) {
				updateSceneFields(newVal);
				runDataActiveRunCache = newVal;
			}
		}
	});
	
	function updateSceneFields(runData) {
		// Reset important stuff.
		currentTeamsData = [];
		teamMemberIndex = [];
		clearTimeout(rotationTO);
		init = true;
		
		if (dnd) {
			var urlPos = window.location.hash.replace('#', '');
			
			var team = runData.teams[parseInt(urlPos)];
			team.members.forEach(member => {
				var teamData = {showTeamIcon: team.members.length > 1, members: []};
				teamData.members.push(createMemberData(member));
				currentTeamsData.push(teamData);
			});
		}
		
		else {
			// modified to put each team member in a different name tag cause no onsite 
			// coops in an online event
			runData.players.forEach(player => {
				var teamData = {showTeamIcon: false, members: [createMemberData(player)]};
				currentTeamsData.push(teamData);
			});
		}
		
		// Set up team member indices so we can keep track on what team member is being shown.
		for (var i = 0; i < currentTeamsData.length; i++) {teamMemberIndex[i] = 0;}
		
		// Clean out player containers not needed.
		if (currentTeamsData.length < playerContainers.length) {
			for (var i = currentTeamsData.length; i < playerContainers.length; i++) {
				animationCleanPlayerData(playerContainers[i]);
			}
		}
		
		// If the first team has multiple runners, make the display timers shorter.
		if (currentTeamsData[0] && currentTeamsData[0].members.length > 1) {
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
				animationChangePlayerData(playerContainers[i], currentTeamsData[i].members[index], false, true, currentTeamsData[i].showTeamIcon);
			else
				animationChangePlayerData(playerContainers[i], currentTeamsData[i].members[index], false);
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
			animationChangePlayerData(playerContainers[i], currentTeamsData[i].members[index], true);
		}
		
		rotationTO = setTimeout(rotateTeamMembers, displayTwitchFor);
	}
	
	// Change settings to go to the next team member, if applicable.
	function rotateTeamMembers() {
		for (var i = 0; i < teamMemberIndex.length; i++) {
			teamMemberIndex[i]++;
			
			// If we've reached the end of the team member array, go back to the start.
			if (teamMemberIndex[i] >= currentTeamsData[i].members.length) teamMemberIndex[i] = 0;
		}
		
		showNames();
	}
	
	// Easy access to create member data object used above.
	function createMemberData(member) {
		// Gets username from URL.
		if (member.twitch && member.twitch.uri) {
			var twitchUsername = member.twitch.uri.split('/');
			twitchUsername = twitchUsername[twitchUsername.length-1];
		}
		
		var memberData = {
			name: member.names.international,
			twitch: twitchUsername,
			region: member.region
		};
		
		return memberData;
	}
});