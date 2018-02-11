'use strict';

// Declaring other variables.
var nodecg = require('./utils/nodecg-api-context').get();

// Replicants (temp until they are moved around).
var donationTotal = nodecg.Replicant('donationTotal', {defaultValue: 0});

// For testing donation total going up.
/*setInterval(() => {
	var random = Math.round(1+(Math.random()*50));
	donationTotal.value += random;
	console.log(random);
}, 10000);*/