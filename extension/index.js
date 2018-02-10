'use strict';

// Referencing other files.
var nodecgAPIContext = require('./utils/nodecg-api-context');

module.exports = function(nodecg) {
	// Store a reference to this NodeCG API context in a place where other libs can easily access it.
	// This must be done before any other files are `require`d.
	nodecgAPIContext.set(nodecg);
	
	// Initalising replicants.
	// Doing this in an extension so we don't need to declare the options everywhere else.
	var songData = nodecg.Replicant('songData', {defaultValue: {'title': 'No Track Playing/No Data Available', 'playing': false}, persistent: false});
}