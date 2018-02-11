'use strict';

// Declaring other variables.
var esaBarLogoCurrentRotation = 0; // 0: normal - 1: hashtag
var esaBarTicks = 0;

function changeESALogo() {
	// JQuery selectors.
	var smallLogo = $('#esaBarLogoContainer #esaSmallLogo');
	var hashtag = $('#esaBarLogoContainer #esaHashtagLogo');
	
	// Logo will not change until 7th tick (30 seconds).
	esaBarTicks++;
	if (esaBarTicks < 7)
		return;
	else
		esaBarTicks = 1;
	
	// Change to hashtag logo after 30s.
	if (esaBarLogoCurrentRotation === 0)
		animationFadeOutInElements(smallLogo, hashtag);
	
	// Change to normal logo after 30s.
	else
		animationFadeOutInElements(hashtag, smallLogo);
	
	esaBarLogoCurrentRotation ^= 1; // Toggle between 0 and 1.
}