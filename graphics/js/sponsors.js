'use strict';
$(() => {
	// JQuery selectors.
	var sponsorContainer = $('#sponsorContainer');
	
	var sponsorRotationInit = false;
	var sponsorImages = nodecg.Replicant('assets:sponsors');
	sponsorImages.on('change', newVal => {
		if (!sponsorRotationInit && newVal.length > 0) {
			setInterval(rotateSponsors, 10000);
			rotateSponsors();
			sponsorRotationInit = true;
		}
	});
	
	var index = 0;
	function rotateSponsors() {
		changeSponsorImage(sponsorContainer, sponsorImages.value[index].url);
		index++;
		if (index >= sponsorImages.value.length) index = 0;
	}
	
	function changeSponsorImage(element, assetURL) {
		$('.sponsorLogoCurrent', element).animate({'opacity': '0'}, 1000, 'linear');
		
		element.append('<div class="sponsorLogo sponsorLogoNext"></div>');
		
		$('.sponsorLogoNext', element).css('background-image', (assetURL)?'url("'+assetURL+'")':'none');
		
		$('.sponsorLogoNext', element).animate({'opacity': '1'}, 1000, 'linear', () => {
			$('.sponsorLogoCurrent', element).remove();
			$('.sponsorLogoNext', element).removeClass('sponsorLogoNext').addClass('sponsorLogoCurrent');
		});
	}
});