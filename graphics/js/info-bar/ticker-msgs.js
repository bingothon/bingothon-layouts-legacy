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

// Choose a random index on startup.
chooseRandomMessageIndex(true);

// Replicants
var bidsRep = nodecg.Replicant('bids');
var prizesRep = nodecg.Replicant('prizes');
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

// Cycles the actual ticker messages that can be shown.
function showTickerMessages() {	
	var retry = false; // If this becomes true, we'll run this function again.
	
	console.log(messageIndex);
	
	// Skip tick if still showing a message.
	if (showingMessage)
		return;
	
	// Showing new donations has priority.
	if (newDonations.length > 0) {
		// show donation code goes here
		displayMessage();
		newDonations.shift(); // Remove first donation.
		return;
	}
	
	// Bids
	if (messageIndex === 0) {
		if (bidsRep.value.length > 0) {
			displayMessage();
			// show bid code goes here
		}
		else retry = true;
	}
	
	// Prizes
	if (messageIndex === 1) {
		if (prizesRep.value.length > 0) {
			displayMessage();
			// show prizes code goes here
		}
		else retry = true;
	}
	
	// Coming Up Run
	if (messageIndex === 2) {
		// Will only trigger this if there's at least 1 run still to come.
		var indexOfCurrentRun = findIndexInRunDataArray(runDataActiveRun.value, runDataArray.value);
		if (runDataArray.value[indexOfCurrentRun+1]) {
			displayMessage();
			// show next run code goes here
		}
		else retry = true;
	}
	
	// Recent Top Donation
	if (messageIndex === 3) {
		if (showRecentTopDonation && recentTopDonation) {
			// show top donation code goes here
			displayMessage();
			resetRecentTopDonationTimer();
		}
		else retry = true;
	}
	
	chooseRandomMessageIndex();
	if (retry)
		showTickerMessages();
}

// Changes and fully displays the message lines supplied.
function displayMessage(l1Message, l2Message) {
	denyMessageToChange();
	
	l1Message = 'This is one line.';
	l2Message = '🤔 This is another line that spills off to the side to mimic a longer message that would need to scroll if it was actually there during the marathon.';
	//l2Message = '🤔 This is a way shorter line that needs no scrolling.';
	
	var amountToScroll = 0;
	var amountToWait = 2000; // Waiting before/after scrolling.
	var timeToShow = 21000-(amountToWait*2); // All messages get at least 21 seconds (excluding fades).
	var timeToScroll = 0;
	
	animationFadeOutElement(messageLinesWrapper, () => {
		messagesLine1.html(l1Message);
		messagesLine2.html(twemoji.parse(l2Message)); // Replace emojis with Twitter ones.
		
		messagesLine2.css('margin-left', '0px'); // Reset margin for scrolling if needed.
		messagesLine2.show(); // Reset display of line 2 if we need to.
		
		if (!l2Message)
			messagesLine2.hide();
		else {
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
		}
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