'use strict';

// Declaring modules.
var chokidar = require('chokidar');
var fs = require('fs');

// Referencing other files.
var nodecgAPIContext = require('./utils/nodecg-api-context');

module.exports = function(nodecg) {
	// Store a reference to this NodeCG API context in a place where other libs can easily access it.
	// This must be done before any other files are `require`d.
	nodecgAPIContext.set(nodecg);
	
	// Initalising some replicants.
	// Doing this in an extension so we don't need to declare the options everywhere else.
	var songs = nodecg.Replicant('songs', {defaultValue: [], persistent: false});
	var songData = nodecg.Replicant('songData', {defaultValue: {'title': 'No Track Playing/No Data Available', 'playing': false}, persistent: false});
	var hostData = nodecg.Replicant('hostData', {defaultValue: []});
	var hostDisplayStatus = nodecg.Replicant('hostDisplayStatus', {defaultValue: false});
	
	// Other extension files we need to load.
	require('./host-api');
	require('./tracker');
	require('./emotes');
	
	// Get and keep an eye on the songs directory to update the replicant.
	var mp3Dir = __dirname+'/../graphics/mp3/';
	chokidar.watch(mp3Dir).on('all', (event, path) => {
		var songsList = [];
		fs.readdir(mp3Dir, (err, files) => {
			if (!err)
				files.forEach(song => {if (song.endsWith('.mp3')) {songsList.push(song);}});
			songs.value = songsList;
			//nodecg.log.info('Songs list was updated to reflect folder changes.');
		});
	});
}