'use strict';
$(() => {
	// JQuery selectors.
	var sponsorContainer = $('#sponsorContainer');
	
	var init = false;
	var sponsorImagesModified = [];
	var sponsorImages = nodecg.Replicant('assets:sponsors');
	sponsorImages.on('change', newVal => {
		// Insert Twitch/Elgato logos 3 times before anything else.
		for (var i = 0; i < 3; i++) {
			newVal.forEach(logo => {
				if (i >= 2 || (i < 2 && (logo.name.toLowerCase().indexOf('twitch') >= 0 || logo.name.toLowerCase().indexOf('elgato') >= 0)))
					sponsorImagesModified.push(logo);
			});
		}
		
		// If we aren't currently doing a rotation and there are logos available, start it off.
		if (!init && sponsorImagesModified.length > 0) {
			setInterval(rotateSponsors, 60000);
			rotateSponsors();
			init = true;
		}
	});
	
	var index = 0;
	function rotateSponsors() {
		animationChangeSponsorImage(sponsorContainer, sponsorImagesModified[index].url);
		index++;
		if (index >= sponsorImagesModified.length) index = 0;
	}
});