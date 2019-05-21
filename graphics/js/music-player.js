'use strict';
$(function() {
	var jsmediatags = window.jsmediatags;
	var isOBS = (window.obsstudio) ? true : false;
	var defaultVolume = 0.2;
	var init = false;
	var skippingSong = false;
	var pausingSong = false;
	var lastSongPlayed = '';
	var audioPlayer = $('#audioPlayer');
	var mp3Source = $('#mp3_src')[0];

	var musicPlayerVolumeRep = nodecg.Replicant('musicPlayerVolume', {defaultValue:20});
	musicPlayerVolumeRep.on('change',newVal=>{
		audioPlayer[0].volume = newVal/100;
	});
	
	// Stores song data to be displayed on layouts.
	var songData = nodecg.Replicant('songData');
	
	var songs = nodecg.Replicant('songs');
	songs.on('change', () => {
		if (!init && songs.value.length) {
			init = true;
			
			playNextSong();
			
			audioPlayer[0].onended = function() {
				if (!skippingSong) playNextSong();
			}
			
			// For detecting when OBS can see the player.
			if (isOBS) {
				window.obsstudio.onActiveChange = function(active) {
					if (!skippingSong) {
						if (active) unpauseMusic();
						else pauseMusic();
					}
				};
			}
		}
	});
	
	// Triggered from a dashboard button.
	/*nodecg.listenFor('skipSong', function() {
		skippingSong = true;
		pauseMusic(function() { // Fade out and pause track.
			playNextSong(); // Move to the next track.
			audioPlayer[0].volume = defaultVolume; // Set volume back to default.
			skippingSong = false;
		});
	});*/
	
	// Triggered from a dashboard button.
	/*nodecg.listenFor('pausePlaySong', function() {
		if (songPlayingReplicant.value) pauseMusic();
		else unpauseMusic();
	});*/
	
	function playNextSong() {
		// Remove last song played so it doesn't accidentally repeat.
		var lastSongIndex = songs.value.indexOf(lastSongPlayed);
		var songsPurged = songs.value.slice(0);
		if (lastSongIndex >= 0 && songs.value.length > 1)
			songsPurged.splice(lastSongIndex, 1);
		
		// Pick a new song to play and play it.
		var randomSong = songsPurged[Math.floor(Math.random()*songsPurged.length)];
		lastSongPlayed = randomSong;
		songData.value.playing = true;
		mp3Source.src = 'mp3/'+randomSong;
		audioPlayer[0].load();
		audioPlayer[0].play();
		getMusicTagData(mp3Source.src, function(err, title, artist) {
			if (!err) songData.value.title = title+' - '+artist;
			else songData.value.title = 'No Track Playing/No Data Available';
		});
	}
	
	function unpauseMusic() {
		pausingSong = true;
		songData.value.playing = true;
		audioPlayer[0].play();
		audioPlayer.stop(); // stop any "animation" if it's going on
		audioPlayer.animate({'volume': musicPlayerVolumeRep.value/100}, 5000, 'linear', function() {
			pausingSong = false;
		});
	}
	
	function pauseMusic(callback) {
		pausingSong = true;
		songData.value.playing = false;
		audioPlayer.stop(); // stop any "animation" if it's going on
		audioPlayer.animate({'volume': 0}, 5000, 'linear', function() {
			audioPlayer[0].pause();
			pausingSong = false;
			if (callback) callback();
		});
	}
	
	// This works with both close and refresh (well, it should do).
	$(window).on('beforeunload', () => {
		songData.value.playing = false;
		songData.value.title = 'No Track Playing/No Data Available';
	});
	
	// callback: error (true/false), title, artist
	function getMusicTagData(fileURL, callback) {
		jsmediatags.read(fileURL, {
			onSuccess: function(tag) {
				// Checking if the title is available, if not will callback an error.
				if (tag && tag.tags && tag.tags.title) callback(false, tag.tags.title, tag.tags.artist);
				else callback(true);
			},
			onError: function(error) {
				callback(true);
			}
		});
	}
});