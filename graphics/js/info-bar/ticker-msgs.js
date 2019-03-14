'use strict';

// The bundle name where all the run information is pulled from.
var speedcontrolBundle = 'nodecg-speedcontrol';

// Declaring other variables.
var newDonations = []; // Any new donations are stored for check on the ticks.
var recentTopDonation;
var showRecentTopDonation;
var recentTopDonationTO;
var topDonationDelay = 300000; // 5 minutes
var showingMessage = false;
var messageIndex = 0;
var nextChallenges = []; // Aka Incentives
var nextPolls = []; // Aka Bid Wars
var prizeCache = [];
var nextRunsCache = [];
var lastMessageType = -1;

var recentDonations = [];

// Choose a random index on startup.
chooseRandomMessageIndex(true);

// Replicants
var openBidsReplicant = nodecg.Replicant('trackerOpenBids', speedcontrolBundle, {defaultValue: []});
var donationsReplicant = nodecg.Replicant('trackerDonations', speedcontrolBundle, {defaultValue: []});
var runDataArray = nodecg.Replicant('runDataArray', speedcontrolBundle);
var runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);

// JQuery selectors.
var messagesContainer, messagesLine1, messagesLine2, messageLinesWrapper;
$(() => {
	messagesContainer = $('#generalMessagesContainer');
	messageLinesWrapper = $('#linesWrapper');
	messagesLine1 = $('#linesWrapper .line1');
	messagesLine2 = $('#linesWrapper .line2');
});
/*
nodecg.listenFor('newDonation', speedcontrolBundle, donation => {
	nodecg.log.info('got donation!');
	newDonations.push(donation);
	
	// Stores last donation
	// It will then be shown every so often until it's pushed off by another one.
	recentTopDonation = donation;
	resetRecentTopDonationTimer();
});*/

donationsReplicant.on('change', (newDonations)=>{
	recentDonations = newDonations.slice(0,4);
})

// When challenges/incentives changes load the next 3 into the cache to display them
openBidsReplicant.on('change',(newBids)=>{
	// put next 4 bids that have a goal to challenges
	// and 4 without a goal to polls
	nextChallenges = newBids.filter((bid)=>bid.goal!=null).slice(0,3);
	nextPolls = newBids.filter((bid)=>bid.goal==null).slice(0,3);
});

// Donation test code below.
/*var donationExample = {
	id: 1,
	donor_visiblename: 'tester123',
	amount: '25.00',
	comment_state: 'APPROVED',
	comment: 'zoton2\'s test donation which has a lot of Kappa s and a whole load of OneHand s but a bit less 4Head s and hopefully this message is quite long now.',
	time_received: '2018-02-04 16:18:01+00:00'
};

setTimeout(() => {
	newDonations.push(donationExample);
	recentTopDonation = donationExample;
	resetRecentTopDonationTimer();
}, 10000);*/

// Bids/prizes test code below.
/*var bidsTemp = JSON.parse('[{"id":3,"name":"zoton2 finishes the tracker","total":999,"game":"Inspector Gadget: Mad Robots Invasion","category":"Any%","goal":1000},{"id":4,"name":"Language","total":20,"game":"The Simpsons: Hit & Run","category":"All Story Missions","options":[{"id":5,"parent":4,"name":"English","total":0},{"id":6,"parent":4,"name":"French","total":0},{"id":7,"parent":4,"name":"German","total":0},{"id":8,"parent":4,"name":"Spanish","total":20}]}]');
var prizesTemp = JSON.parse('[{"id":2,"name":"Stream Deck","provided":"Elgato","minimum_bid":5,"start_timestamp":"2018-02-20T05:00:00Z","end_timestamp":"2018-02-21T11:00:00Z"}]');*/

// Cycles the actual ticker messages that can be shown.
// Triggered every tick from tick-handler.js
function showTickerMessages() {	
	var retry = false; // If this becomes true, we'll run this function again.
	
	// Skip tick if still showing a message.
	if (showingMessage)
		return;
	
	// Showing new donations has priority.
	/*if (newDonations.length > 0) {
		showDonation(newDonations[0], true);
		newDonations.shift(); // Remove first donation.
		return;
	}*/
	
	// Challenges
	if (messageIndex === 0 || messageIndex === 1 || messageIndex === 2) {
		if (nextChallenges.length > 0 && lastMessageType !== 0) {
			showChallenge();
			lastMessageType = 0;
		}
		else
			retry = true;
	}
	
	// Polls
	if (messageIndex === 3 || messageIndex === 4 || messageIndex === 5) {
		if (nextPolls.length > 0 && lastMessageType !== 1) {
			showPoll();
			lastMessageType = 1;
		}
		else
			retry = true;
	}
	
	// Upcoming Run
	if (messageIndex === 6 || messageIndex === 7 || messageIndex === 8) {
		// Will only trigger this if there's at least 1 run still to come.
		var indexOfCurrentRun = findIndexInRunDataArray(runDataActiveRun.value);
		if (runDataArray.value[indexOfCurrentRun+1] && lastMessageType !== 2) {
			showUpcomingRun();
		lastMessageType = 2;
		}
		else retry = true;
	}
	
	// Recent Top Donation
	if (messageIndex === 9 || messageIndex === 10) {
		if (recentDonations.length != 0 && lastMessageType !== 3) {
			showDonation();
			lastMessageType = 3;
		}
		else retry = true;
	}
	
	// bingothon promotional message.
	if (messageIndex === 11) {
		if (lastMessageType !== 4) {
			displayMessage('<span class="textGlow">This is Bingothon 2018, enjoy your stay!</span>', null, 30, null, true);
			lastMessageType = 4;
		}
		else retry = true;
	}
	
	// DWB promotional message.
	if (messageIndex === 12) {
		if (lastMessageType !== 5) {
			displayMessage('<span class="textGlow">Bingothon benefits Doctors Without Borders</span>', null, 30, null, true);
			lastMessageType = 5;
		}
		else retry = true;
	}
	
	// Donation URL message.
	if (messageIndex === 13) {
		if (lastMessageType !== 6) {
			displayMessage('<span class="textGlow">Donate @ <span class="greyText">tiltify.com/@bingothon</span></span>', null, 30, null, true);
			lastMessageType = 6;
		}
		else retry = true;
	}
	
	chooseRandomMessageIndex();
	if (retry)
		showTickerMessages();
}

// Formats donations to be sent to displayMessage.
function showDonation() {
	var donation = recentDonations[Math.floor(Math.random()*recentDonations.length)];
	var user = donation.donor;
	var amount = ' ('+formatDollarAmount(parseFloat(donation.amount))+')';
	var isNew = false; // maybe implement a check later if thats new, for now just pick one of the 4 recent ones to show
	if (isNew)
		var line1 = '<span class="messageUppercase textGlow">New Donation:</span> '+user+amount;
	else
		var line1 = user+amount;
	
	// Regex removes multiple spaces/newlines from donation messages.
	var message = donation.comment;
	message = (message && message !== '') ? message.replace(/\s\s+|\n/g, ' ') : undefined;
	
	displayMessage(line1, message, 24, 20);
}

// Handles challenge/incentive, chooses one at random to show. Returns false if there is no challenge active
function showChallenge() {
	var challenge = nextChallenges[Math.floor(Math.random()*nextChallenges.length)];
	
	var line2;
	
	// Normal Goal
	var line1 = '<span class="messageUppercase textGlow">Upcoming Goal:</span>';
	var line2 = '<span class="greyText">'+challenge.game + ' - ' + challenge.bid + '</span>: '+formatDollarAmount(challenge.amount_raised)+'/'+formatDollarAmount(challenge.goal);
	
	displayMessage(line1, line2, 23, 21);
}

// Handles challenge/incentive, chooses one at random to show.
function showPoll() {
	var poll = nextPolls[Math.floor(Math.random()*nextPolls.length)];
	
	var line2;
	
	// Bid War
	var line1 = '<span class="messageUppercase textGlow">Upcoming Bid War:</span> '+poll.game + ' - ' + poll.bid ;
	var optionsFormatted = [];
	poll.options.forEach(option => {
		optionsFormatted.push(option.name+' ('+formatDollarAmount(option.amount_raised)+')');
	});
	if(poll.options.length != 0) {
		var line2 = optionsFormatted.join('/');
		if (poll.allow_custom_options) {
			line2 = line2 + ' ...or submit your own ideas!';
		}
	} else {
		var line2 = "No options submitted, be the first!";
	}
	
	
	displayMessage(line1, line2, 23, 21);
}

// Handles prize cache if empty and chooses one at random to show.
function showPrize() {
	if (!prizeCache.length) prizeCache = prizesRep.value; // Refill prize cache if it's empty.
	//if (!prizeCache.length) prizeCache = prizesTemp;
	var random = getRandomInt(prizeCache.length);
	var prize = prizeCache[random]; // Pick random prize from the cache.
	prizeCache.splice(random, 1); // Remove this prize from the cache.
	
	var line1 = '<span class="messageUppercase textGlow">Prize Available:</span> '+prize.name;
	var line2 = 'Provided by '+prize.provided+', minimum donation amount: '+formatDollarAmount(prize.minimum_bid);
	
	displayMessage(line1, line2, 26, 18);
}

// Pick an upcoming run and display it.
function showUpcomingRun() {
	// Refill cache if empty.
	if (!nextRunsCache.length) nextRunsCache = getNextRuns(runDataActiveRun.value, 4);
	
	// Need a while loop in case the run we pick can't be shown.
	var randomRun;
	while (!randomRun) {
		var randomInt = getRandomInt(nextRunsCache.length);
		
		// Check if run is still to come, if not we need to ignore it.
		if (nextRunsCache[randomInt].scheduledS > moment().unix())
			randomRun = nextRunsCache[randomInt];
		
		nextRunsCache.splice(randomInt, 1);
		if (!nextRunsCache.length) break;
	}
	if (!randomRun) return; // This shouldn't happen, just a safe guard in case.
	
	var when = moment.unix(randomRun.scheduledS).fromNow();
	var line1 = '<span class="messageUppercase textGlow">Coming Up '+when+':</span> '+randomRun.game;
	var line2 = randomRun.category+', ran on '+randomRun.system+' with '+formPlayerNamesString(randomRun);
	
	displayMessage(line1, line2, 24, 20);
}

// Changes and fully displays the message lines supplied, and changes font size if specified.
function displayMessage(l1Message, l2Message, fontSize1, fontSize2, center) {
	denyMessageToChange();
	
	var amountToScroll = 0;
	var amountToWait = 2000; // Waiting before/after scrolling.
	var timeToShow = 21000-(amountToWait*2); // All messages get at least 21 seconds (excluding fades).
	var timeToScroll = 0;
	fontSize1 = fontSize1 || 22;
	fontSize2 = fontSize2 || 22;
	
	animationFadeOutElement(messageLinesWrapper, () => {
		messagesLine1.html(l1Message);
		messagesLine2.css('margin-left', '0px'); // Reset margin for scrolling if needed.
		
		// Changing font sizes.
		messagesLine1.css('font-size', fontSize1+'px');
		messagesLine2.css('font-size', fontSize2+'px');
		
		// To center or not.
		if (center)
			messagesContainer.css('align-items', 'center');
		else
			messagesContainer.css('align-items', 'flex-start');
		
		if (!l2Message)
			messagesLine2.hide();
		else {
			messagesLine2.show();
			l2Message = replaceEmotes(l2Message); // Replace emoticon names with their images.
			l2Message = twemoji.parse(l2Message); // Replace emojis with Twitter ones.
			messagesLine2.html(l2Message);
		}
		
		// Waiting for all images to load in before measuring width.
		// Either emojis or emoticons need to be loaded in if present.
		messageLinesWrapper.waitForImages(() => {
			if (l2Message) {
				// Work out how much we need to move the text to make it scroll (if at all).
				// Scrolling needs to over/undercompensate due to the padding on the container.
				var paddingLeft = parseInt(messagesContainer.css('padding-left'));
				var paddingRight = parseInt(messagesContainer.css('padding-right'));
				var containerWidthWOPadding = messagesContainer.width()-paddingLeft-paddingRight;
				
				// We need to scroll if the message width is bigger than the container.
				if (containerWidthWOPadding < messagesLine2.width()) {
					amountToScroll = messagesLine2.width()-containerWidthWOPadding;
					timeToScroll = amountToScroll*13;
					
					// Make time to scroll the full amount of time if it's too short.
					if (timeToScroll < timeToShow)
						timeToScroll = timeToShow;
				}
			}
				
			animationFadeInElement(messageLinesWrapper, () => {
				// Do the scrolling logic if we need to.
				if (amountToScroll > 0) {
					// Animate text after a delay so it scrolls and everything is seen.
					messagesLine2.delay(amountToWait).animate({'margin-left': '-'+amountToScroll+'px'}, timeToScroll, 'linear', () => {
						setTimeout(allowMessageToChange, amountToWait);
					});
				}
				else
					setTimeout(allowMessageToChange, (amountToWait*2)+timeToShow);
			});
		});
	});
}

// Randomly chooses the next message type to show, excluding what was just shown.
function chooseRandomMessageIndex(init) {
	var messageIndexList = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
	if (!init) messageIndexList.splice(messageIndex, 1);
	messageIndex = messageIndexList[getRandomInt(messageIndexList.length)];
}

// Helper function used above to reset variables/timeouts.
function resetRecentTopDonationTimer() {
	showRecentTopDonation = false;
	clearTimeout(recentTopDonationTO);
	recentTopDonationTO = setTimeout(() => {showRecentTopDonation = true;}, topDonationDelay);
}

// Simple function to reference when needed.
function allowMessageToChange() {
	showingMessage = false;
}

// Simple function to reference when needed.
function denyMessageToChange() {
	showingMessage = true;
}