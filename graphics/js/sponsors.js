'use strict';
$(() => {
	// JQuery selectors.
	var sponsorContainer = $('#sponsorContainer');
	
	var init = false;
	var sponsorImages = nodecg.Replicant('assets:sponsors');
	sponsorImages.on('change', newVal => {
		preloadImages(newVal);
		
		// If we aren't currently doing a rotation and there are logos available, start it off.
		if (!init && newVal.length > 0) {
			setInterval(rotateSponsors, 10000/*60000*/);
			setTimeout(rotateSponsors, 1000); // Dirty delay to allow the preload to happen.
			init = true;
		}
	});
	
	var index = 0;
	function rotateSponsors() {
		animationChangeSponsorImage(sponsorContainer, sponsorImages.value[index].url);
		index++;
		if (index >= sponsorImages.value.length) index = 0;
	}
	
	// Used to preload the sponsor images into the DOM so some JavaScript resizing works correctly.
	function preloadImages(array) {
		$.each(array, (i, val) => {
			var element = $('<img>').attr('src', val.url).appendTo('body').hide();
		});
	}
});