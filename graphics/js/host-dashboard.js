'use strict';
$(() => {
	var bingothonBundleName = 'speedcontrol-bingothon';
	// JQuery selectors.
	var donationTotalElement = $('#donationTotal');
	var prizesContainer = $('#prizesContainer');
	var bidsContainer = $('#bidsContainer');
	var runsContainer = $('#runsContainer');
	var dwbInfoContainer = $('#dwbInfoContainer');
        var button = $('#Button');
        var dwbInfoIndex = 0;
	
	// Declaring variables.
	var prizeHTML = $('<div class="prize"><span class="prizeName"></span><br>Provided by <span class="prizeProvider"></span><br>minimum donation <span class="prizeMinDonation"></span><br>Ends: <span class="prizeEnd"></span></div>');
	var bidHTML = $('<div class="bid"><span class="bidGame"></span><br><span class="bidName"></span></div>')
	var runHTML = $('<div class="run"><span class="justMissed">YOU HAVE JUST WATCHED<br></span><span class="gameName"></span><br><span class="gameCategory"></span><br><span class="gameConsole"></span><br><span class="gameRunners"></span><br><span class="gameTime"></span><br><span class="gameFinal"></span></div>');
	
	// This should go in external file really.
        
        
        var dwbText = [];
        dwbText[0] = "Doctors Without Borders is an independent global movement that provides medical aid where it is needed most. All donations from our marathon will go to help their cause. If you would like to donate, type !donate in the chat, and a link will appear where you can donate to the marathon, whose money will go directly to charity. So please, help the needy and donate to our cause.";
        
        dwbText[1] = "Doctors Without Borders operates in over 70 countries, across all of the world's continents. From Nauru to Niger, this foundation is truly worldwide. If you want to provide aid to needy people across the world, please consider donating to the cause: just type !donate and a donation link will appear.";
        
        dwbText[2] = "Since 1971, Doctors Without Borders has treated tens of millions of people around the world, and is completely transparent. And over 95% of funds raised go either to raise more funds or to help the needy: one of the highest rates for any charity. If you want to support them, just type !donate in the chat, and a link where you can donate will appear!"
        
        dwbText[3] = "Doctors Without Borders was awarded the Nobel Peace Prize in 1999 for its role in helping people around the world regardless of political and religious beliefs. If you want to help this great organization, if you type !donate, a link will appear where you can both donate to the charity and fund some of the marathon's incentives. We, and the people around the world, appreciate the support."
        
        dwbText[4] = "It is stated in the Doctors Without Borders charter that '[their] mission is to provide lifesaving medical care to those most in need.' If you want to support them, 100% of our funds raised go to the charity. So please, consider donating: by typing !donate in the chat, a link will appear where you can give money directly to the Doctors Without Borders organization."
        
        dwbText[5] = "In addition to all of their applied charitable work, Doctors Without Borders also created and produced easily transportable disaster kits, which are now models used by emergency relief organizations worldwide. If you want to help an organization that has had such a profoundly positive influence on medicine, type !donate in the chat, and a link will appear where you can donate."
        
        dwbText[6] = "Doctors Without Borders is so well organized that they can load and fly planes to zones of crisis within 24 hours. If you want to support an organization that is always ready to help victims of disaster, please consider supporting them by typing !donate in chat and donating with the link provided."
        
        dwbText[7] = "When a devastating earthquake hit Haiti in 2010, Doctors Without Borders treated the first casualty within minutes. That's because even though their own facilities were damaged, they were immediately prepared to launch a response. If you want to help them, type !donate in the chat and consider donating to the link provided."
        
        dwbText[8] = "Doctors Without Borders has already helped many many people, but they also are researching medicine to help even more people in the future. If you want to help Doctors Without Borders help people, type !donate in the chat and a link will appear where you can give money to Doctors Without Borders."
        
        dwbText[9] = "Doctors Without Borders started off as 300 volunteers, who helped Nicaragua in an earthquake, and since then the organization has grown over 100-fold, and all over the world. If you want to support Doctors Without Borders, please consider donating to our marathon - all proceeds will go to the organization to help people all over the world."
        
	
	// Keep donation total updated.
	var donationTotal = nodecg.Replicant('donationTotal',bingothonBundleName);
	donationTotal.on('change', newVal => {
		donationTotalElement.html(formatDollarAmount(donationTotal.value, true));
	});
	
	// Keep prizes updated.
	//no prizes available, outcommenting
        /*var prizes = nodecg.Replicant('prizes');
	prizes.on('change', newVal => {
		prizesContainer.html('');
		newVal.forEach(prize => {
			var prizeElement = prizeHTML.clone();
			$('.prizeName', prizeElement).html(prize.name);
			$('.prizeProvider', prizeElement).html(prize.provided);
			$('.prizeMinDonation', prizeElement).html(formatDollarAmount(prize.minimum_bid));
			console.log(prize.end_timestamp)
			$('.prizeEnd', prizeElement).html(moment(prize.end_timestamp).format('Do HH:mm'));
			prizesContainer.append(prizeElement);
		});
	});*/
	
	// Keep bids updated.
	var bids = nodecg.Replicant('trackerOpenBids', bingothonBundleName, {defaultValue: []});
	bids.on('change', newVal => {
		var i = 0;
		bidsContainer.html('');
		newVal.forEach(bid => {
			if (i >= 6) return;
			var bidElement = bidHTML.clone();
			$('.bidGame', bidElement).html(bid.game+' - '+bid.bid);
			$('.bidName', bidElement).html(bid.name);
			// Donation Goal
			if (bid.goal != null) {
				var bidLeft = bid.goal - bid.amount_raised;
				bidElement.append('<br>'+formatDollarAmount(bid.amount_raised)+'/'+formatDollarAmount(bid.goal));
				bidElement.append('<br>'+formatDollarAmount(bidLeft)+' to goal'); 
			}
			// Bid War
			else {
				if (bid.options.length) {
					bid.options.forEach(option => {
						bidElement.append('<br>'+option.name+' ('+formatDollarAmount(option.amount_raised)+')')
					});
					
					if (bid.allow_custom_options)
						bidElement.append('<br><i>Users can submit their own options.</i>')
				}
				else
					bidElement.append('<br><i>No options submitted yet.</i>')
			}
			bidsContainer.append(bidElement);
			i++;
		});
	});
	
	var runDataArray = nodecg.Replicant('runDataArray', 'nodecg-speedcontrol');
	var runDataActiveRun = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');
	var runFinishTimes = nodecg.Replicant('runFinishTimes', 'nodecg-speedcontrol');
	var runFinishTimesInit = false;
	var runDataActiveRunInit = false;
	var runsInit = false;
	runFinishTimes.on('change', newVal => {
		runFinishTimesInit = true;
		if (!runsInit && runFinishTimesInit && runDataActiveRunInit) {
			setRuns();
			runsInit = true;
		}
	});
	runDataActiveRun.on('change', newVal => {
		runDataActiveRunInit = true;
		if (runFinishTimesInit && runDataActiveRunInit) {
			setRuns();
			runsInit = true;
		}
	});
	
	function setRuns() {
		runsContainer.html('');
		var indexOfCurrentRun = findIndexInRunDataArray(runDataActiveRun.value);
		for (var i = -1; i < 3; i++) {
			var run = runDataArray.value[indexOfCurrentRun+i];
			if (run) {
				var runElement = runHTML.clone();
				if (i === -1) {
					$('.justMissed', runElement).show();
					if (runFinishTimes.value[runDataActiveRun.value.runID-1]) {
						$('.gameFinal', runElement).html(runFinishTimes.value[runDataActiveRun.value.runID-1]);
						$('.gameFinal', runElement).show();
					}
				}
				else {
					$('.justMissed', runElement).hide();
					$('.gameFinal', runElement).hide();
				}
				$('.gameName', runElement).html(run.game);
				$('.gameCategory', runElement).html(run.category);
				$('.gameConsole', runElement).html(run.system);
				$('.gameRunners', runElement).html(formPlayerNamesString(run));
				$('.gameTime', runElement).html(run.estimate);
				runsContainer.append(runElement);
			}
		}
	}
	
changedwbText();
$('#Button').on('click', changedwbText);
function changedwbText(){
                dwbInfoContainer.html(dwbText[dwbInfoIndex]);
		dwbInfoIndex++;
		if (dwbInfoIndex >= dwbText.length) dwbInfoIndex = 0;
}
});