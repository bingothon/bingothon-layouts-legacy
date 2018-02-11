'use strict';

// TODO: Change font size depending on how long the donation total string is.

// Declaring other variables.
var donationTotalLogoCurrentRotation = 0; // 0: total - 1: StC text
var donationTotalTicks = 0;

function changeDonationTotalStuff() {
	// JQuery selectors.
	var amountText = $('#donationTotalContainer #amountText');
	var stcText = $('#donationTotalContainer #stcText');
	
	donationTotalTicks++;
	
	// Change to StC text after 30s.
	if (donationTotalLogoCurrentRotation === 0 && donationTotalTicks >= 7) {
		animationFadeOutInElements(amountText, stcText);
		donationTotalTicks = 1;
		donationTotalLogoCurrentRotation ^= 1; // Toggle between 0 and 1.
	}
	
	// Change to donation total text after 10s.
	else if (donationTotalLogoCurrentRotation === 1 && donationTotalTicks >= 3) {
		animationFadeOutInElements(stcText, amountText);
		donationTotalTicks = 1;
		donationTotalLogoCurrentRotation ^= 1; // Toggle between 0 and 1.
	}
	
	// other stuff to go here includes changing the total if the above things aren't happening
}