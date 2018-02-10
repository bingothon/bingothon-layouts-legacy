'use strict';
$(() => {
	// JQuery selectors.
	var sponsorContainer = $('#sponsorContainer');
	
	var init = false;
	var sponsorImages = nodecg.Replicant('assets:sponsors');
	sponsorImages.on('change', newVal => {
		// If we aren't currently doing a rotation and there are logos available, start it off.
		if (!init && newVal.length > 0) {
			setInterval(rotateSponsors, 60000);
			rotateSponsors();
			init = true;
		}
	});
	
	var index = 0;
	function rotateSponsors() {
		animationChangeSponsorImage(sponsorContainer, sponsorImages.value[index].url);
		index++;
		if (index >= sponsorImages.value.length) index = 0;
	}
});