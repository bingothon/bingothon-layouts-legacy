'use strict';
$(() => {
	// The bundle name where all the run information is pulled from.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// JQuery selectors.
	var timerText = $('#timerContainer #timer');
	var finishTimeContainers = $('.finishTimeContainer'); // Array
	
	// Declaring other variables.
	var currentTime = '';
	var backupTimerTO;
	
	// Replicants
	var stopwatch = nodecg.Replicant('stopwatch', speedcontrolBundle);
	var finishFlags = nodecg.Replicant('finishFlags', speedcontrolBundle, {defaultValue:[{hasFinished: false, finishTime: '', finishMedal: ''},{hasFinished: false, finishTime: '', finishMedal: ''},{hasFinished: false, finishTime: '', finishMedal: ''},{hasFinished: false, finishTime: '', finishMedal: ''},]});
	stopwatch.on('change', (newVal, oldVal) => {
		if (!newVal) return;
		updateTimer(newVal, oldVal);
		
		// Backup Timer
		clearTimeout(backupTimerTO);
		backupTimerTO = setTimeout(backupTimer, 1000);
	});
	
	// Backup timer that takes over if the connection to the server is lost.
	// Based on the last timestamp that was received.
	// When the connection is restored, the server timer will recover and take over again.
	function backupTimer() {
		backupTimerTO = setTimeout(backupTimer, 200);
		if (stopwatch.value.state === 'running') {
			var missedTime = Date.now() - stopwatch.value.timestamp;
			var timeOffset = stopwatch.value.milliseconds + missedTime;
			updateTimer({time:msToTime(timeOffset)});
		}
	}
	
	function updateTimer(newVal, oldVal) {
		var time = newVal.time || '88:88:88';
		
		// Change class on the timer to change the colour if needed.
		if (oldVal) timerText.toggleClass('timer_'+oldVal.state, false);
		timerText.toggleClass('timer_'+newVal.state, true);
		
		timerText.html(time);
		timerText.lettering(); // Makes each character into a <span>.
		currentTime = time;
	}
	
	/* DEPRECATED
	// Used to hide finish times for everyone.
	nodecg.listenFor('resetTime', speedcontrolBundle, () => {
		finishTimeContainers.each((index, element) => {
			$('#finishTime', element).html('');
			$(element).css('opacity', '0');
		});
	});
	
	// Used to hide finish timers just for the specified index.
	nodecg.listenFor('timerReset', speedcontrolBundle, index => {
		var container = finishTimeContainers.eq(index);
		$('#finishTime', container).html('');
		container.addClass('hideFinishTime');
		container.css('opacity', '0');
	});
	
	// Used to show finish timers for the specified index.
	nodecg.listenFor('timerSplit', speedcontrolBundle, index => {
		if (finishTimeContainers.length > 1) {
			var container = finishTimeContainers.eq(index);
			$('#finishTime', container).html(currentTime);
			container.css('opacity', '100');
		}
	});*/

	finishFlags.on('change', (newFlags) => {
		for(var i = 0;i<newFlags.length;i++) {
			if (newFlags[i].hasFinished) {
				finishTimeContainers.eq(i).css('opacity','100');
			} else {
				finishTimeContainers.eq(i).css('opacity','0');
			}
			// Medal handling todo
			$('#finishTime',finishTimeContainers.eq(i)).text(newFlags[i].finishTime);
		}
	});
});