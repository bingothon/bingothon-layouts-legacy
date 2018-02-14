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
var bidsCache = [];
var prizeCache = [];

// Choose a random index on startup.
chooseRandomMessageIndex(true);

// Replicants
var bidsRep = nodecg.Replicant('bids');
//bidsRep.on('change', newVal => {bidsCache = newVal}); // Refill cache on change.
var prizesRep = nodecg.Replicant('prizes');
//prizesRep.on('change', newVal => {prizeCache = newVal}); // Refill cache on change.
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

nodecg.listenFor('newDonation', donation => {
	newDonations.push(donation);
	
	// Stores last donation $20+.
	// It will then be shown every so often until it's pushed off by another one.
	if (parseFloat(donation.amount) >= 20) {
		recentTopDonation = donation;
		resetRecentTopDonationTimer();
	}
});

// Donation test code below.
var donationExample = {
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
}, 30000);

// Bids/prizes test code below.
var bidsTemp = JSON.parse('[{"id":3,"name":"zoton2 finishes the tracker","total":999,"game":"Inspector Gadget: Mad Robots Invasion","category":"Any%","goal":1000},{"id":4,"name":"Language","total":20,"game":"The Simpsons: Hit & Run","category":"All Story Missions","options":[{"id":5,"parent":4,"name":"English","total":0},{"id":6,"parent":4,"name":"French","total":0},{"id":7,"parent":4,"name":"German","total":0},{"id":8,"parent":4,"name":"Spanish","total":20}]}]');
var prizesTemp = JSON.parse('[{"id":2,"name":"Stream Deck","provided":"Elgato","minimum_bid":5,"start_timestamp":"2018-02-20T05:00:00Z","end_timestamp":"2018-02-21T11:00:00Z"}]');

// Cycles the actual ticker messages that can be shown.
// Triggered every tick from tick-handler.js
function showTickerMessages() {	
	var retry = false; // If this becomes true, we'll run this function again.
	
	// Skip tick if still showing a message.
	if (showingMessage)
		return;
	
	console.log(messageIndex);
	
	// Showing new donations has priority.
	if (newDonations.length > 0) {
		showDonation(newDonations[0], true);
		newDonations.shift(); // Remove first donation.
		return;
	}
	
	// Bids
	if (messageIndex === 0) {
		//if (bidsRep.value.length > 0)
		//if (bidsTemp.length > 0)
			//showBid();
		//else
			retry = true;
	}
	
	// Prizes
	if (messageIndex === 1) {
		//if (prizesRep.value.length > 0)
		if (prizesTemp.length > 0)
			showPrize();
		else
			retry = true;
	}
	
	// Upcoming Run
	if (messageIndex === 2) {
		// Will only trigger this if there's at least 1 run still to come.
		var indexOfCurrentRun = findIndexInRunDataArray(runDataActiveRun.value);
		if (runDataArray.value[indexOfCurrentRun+1]) {
			showUpcomingRun();
		}
		else retry = true;
	}
	
	// Recent Top Donation
	if (messageIndex === 3) {
		if (showRecentTopDonation && recentTopDonation) {
			showDonation(recentTopDonation, false);
			resetRecentTopDonationTimer();
		}
		else retry = true;
	}
	
	chooseRandomMessageIndex();
	if (retry)
		showTickerMessages();
}

// Formats donations to be sent to displayMessage.
function showDonation(donation, isNew) {
	var user = donation.donor_visiblename;
	var amount = ' ($'+donation.amount+')';
	if (isNew)
		var line1 = '<span class="messageUppercase textGlow">New Donation:</span> '+user+amount;
	else
		var line1 = user+amount;
	
	// Regex removes multiple spaces/newlines from donation messages.
	var message = donation.comment;
	message = (message && message !== '') ? message.replace(/\s\s+|\n/g, ' ') : undefined;
	
	displayMessage(line1, message, 24, 20);
}

// UNFINISHED
function showBid() {
	// duh
}

// Handles prize cache if empty and chooses one at random to show.
function showPrize() {
	//if (!prizeCache.length) prizeCache = prizesRep.value; // Refill prize cache if it's empty.
	if (!prizeCache.length) prizeCache = prizesTemp; // Refill prize cache if it's empty.
	var random = getRandomInt(prizeCache.length);
	var prize = prizeCache[random]; // Pick random prize from the cache.
	prizeCache.splice(random, 1); // Remove this prize from the cache.
	
	var line1 = '<span class="messageUppercase textGlow">Prize Available:</span> '+prize.name;
	var line2 = 'Provided by '+prize.provided+', minimum donation amount: $'+prize.minimum_bid.toFixed(2);
	
	displayMessage(line1, line2, 26, 18);
}

// UNFINISHED
// Pick an upcoming run and display it.
// TODO:
// > Needs a check to make sure the scheduled time hasn't passed.
// > Needs a cache system like bids/prizes.
function showUpcomingRun() {
	var nextRuns = getNextRuns(runDataActiveRun.value, 4);
	var randomRun = nextRuns[getRandomInt(nextRuns.length)];
	
	var when = moment.unix(randomRun.scheduledS).fromNow();
	var line1 = '<span class="messageUppercase textGlow">Coming Up '+when+':</span> '+randomRun.game;
	var line2 = randomRun.category+', ran on '+randomRun.system+' by '+formPlayerNamesString(randomRun);
	
	displayMessage(line1, line2, 24, 20);
}

// Changes and fully displays the message lines supplied, and changes font size if specified.
function displayMessage(l1Message, l2Message, fontSize1, fontSize2) {
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
		messagesLine2.show(); // Reset display of line 2 if we need to.
		
		// Changing font sizes.
		messagesLine1.css('font-size', fontSize1+'px');
		messagesLine2.css('font-size', fontSize2+'px');
		
		if (!l2Message)
			messagesLine2.hide();
		else {
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
				}
			}
				
			animationFadeInElement(messageLinesWrapper, () => {
				// Do the scrolling logic if we need to.
				if (amountToScroll > 0) {
					// Animate text after a delay so it scrolls and everything is seen.
					messagesLine2.delay(amountToWait).animate({'margin-left': '-'+amountToScroll+'px'}, timeToScroll, 'linear', () => {
						// Pad the time the message stays around if it's too short.
						if (timeToShow > timeToScroll)
							amountToWait += timeToShow-timeToScroll;
						
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
	var messageIndexList = [0,1,2,3];
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