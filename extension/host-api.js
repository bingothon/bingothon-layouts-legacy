'use strict';

// HTTP endpoints that can be used to trigger showing/hiding host names on the intermission.
// Intended to be used with the Stream Deck.

// Declaring other variables.
var nodecg = require('./utils/nodecg-api-context').get();
var app = require('express')();

// Show Hosts
app.get('/hostcontrol/showhosts', (req, res) => {
	nodecg.sendMessage('showHosts');
	res.status(200);
	res.end();
});

// Show Hosts Temporarily
app.get('/hostcontrol/showhoststemp', (req, res) => {
	nodecg.sendMessage('showHostsTemp');
	res.status(200);
	res.end();
});

// Hide Hosts
app.get('/hostcontrol/hidehosts', (req, res) => {
	nodecg.sendMessage('hideHosts');
	res.status(200);
	res.end();
});

nodecg.mount(app);