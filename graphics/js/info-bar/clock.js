'use strict';
$(() => {
	// JQuery selectors.
	var clockContainer = $('#clockContainer');
	
	// Simple clock with flashing colon.
	var hasColon = false;
	setClock();
	setInterval(setClock, 1000);
	function setClock() {
		var currentTime = moment().format('HH mm');
		if (hasColon) clockContainer.html(currentTime.replace(' ', '<span> </span>'));
		else clockContainer.html(currentTime.replace(' ', '<span>:</span>'));
		hasColon = !hasColon;
	}
});