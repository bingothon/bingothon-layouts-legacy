'use strict';
$(function() {
    const delayCheckIntervalMs = 20000;

    const bingothonBundleName = 'speedcontrol-bingothon';
    // stores all quality options available
    const streamQualities = nodecg.Replicant('stream-qualities', bingothonBundleName, {'defaultValue':[[],[],[],[]]});
    // keeps track of which channel has sound, cause only one at a time can have sound, -1 is all muted
    const soundOnTwitchStream = nodecg.Replicant('sound-on-twitch-stream', bingothonBundleName, {'persistent':false,'defaultValue':-1});
    // main control panel for streams
    const streams = nodecg.Replicant('twitch-streams', bingothonBundleName);
    // streams.values is an array that consists of elements with the following attributes;
    // channel, width, height, quality, volume, muted, paused, hidden
    const streamDelay = nodecg.Replicant('stream-delay',bingothonBundleName,{'defaultValue':[0,0,0,0], 'persistent':false});
    var playerList = [];
    streams.on('change', (newStreams, oldStreams) => {
        for(var i in newStreams) {
            const stream = newStreams[i];
            // create player if it does't exists
            // so all 4 players are always there just hidden, paused and muted maybe
            if (!playerList[i]) {
                var twitchContainer = document.getElementById('twitch-player'+i);
                if (!twitchContainer) {
                    // it's OK if a hidden stream has no html
                    if (!stream.hidden) {
                        nodecg.log.info('Tried to set up twitch player '+i+' but player doesn\' exist in html!');
                    }
                    continue;
                }
                createTwitchPlayer(i);
            } else {
                const oldStream = playerList[i];
                if (stream.hidden) {
                    $('#twitch-player'+i).hide();
                } else {
                    $('#twitch-player'+i).show();
                }
                const streamFrame = $('#twitch-player'+i+' iframe');
                var $twitchContainer = $('#twitch-player'+i);
                var newWidth = $twitchContainer.width()*stream.widthPercent/100;
                var newHeight = $twitchContainer.height()*stream.heightPercent/100;
                if (streamFrame.attr('width') != newWidth || streamFrame.attr('height') != newHeight) {
                    // since we can't change the twitch player size after it is displayed, we
                    // need to refresh it
                    // delete old player
                    $('#twitch-player'+i).html('');
                    // and create new one
                    createTwitchPlayer(i);
                    // the create did everything
                    continue;
                }
                // check left and top shift
                var newLeft = newWidth*stream.leftPercent/100;
                if ($twitchContainer.css('left') != newLeft) {
                    $twitchContainer.css('left', newLeft)
                }
                var newTop = newHeight*stream.topPercent/100;
                if ($twitchContainer.css('top') != newTop){
                    $twitchContainer.css('top', newTop);
                }
                if (oldStream.getQuality() != stream.quality) {
                    oldStream.setQuality(stream.quality);
                }
                if (oldStream.getVolume() != stream.volume) {
                    oldStream.setVolume(stream.volume);
                }
                if (oldStream.getChannel() != stream.channel) {
                    oldStream.setChannel(stream.channel);
                }
                if (oldStream.isPaused() != stream.paused) {
                    if (stream.paused) {
                        oldStream.pause();
                    } else {
                        oldStream.play();
                    }
                }
            }
        }
    });

    soundOnTwitchStream.on('change', (newChannel, oldChannel) => {
        if (newChannel == oldChannel) {
            return;
        }
        // mute all, then unmute the right one
        for (var i in playerList) {
            playerList[i].setMuted(true);
        }
        if (playerList[newChannel]) {
            playerList[newChannel].setMuted(false);
        }

    });
    // register listeners to remotely control streams
    nodecg.listenFor('refreshStream',bingothonBundleName,(id) => {
        if (!playerList[id]) {
            nodecg.log.console.warn("Stream with given ID doesn't exist, can't refresh");
            return;
        }
        // delete old player
        $('#twitch-player'+id).html('');
        // and create new one
        createTwitchPlayer(id);
    })

    function createTwitchPlayer(id) {
        const stream = streams.value[id];
        var twitchContainer = document.getElementById('twitch-player'+id);
        if (stream.hidden) {
            $(twitchContainer).hide();
        } else {
            $(twitchContainer).show();
        }
        var $twitchContainer = $('#twitch-player'+id);
        var width = $twitchContainer.width()*stream.widthPercent/100;
        var height = $twitchContainer.height()*stream.heightPercent/100;
        $twitchContainer.css('left',width*stream.leftPercent/100)
        $twitchContainer.css('top',height*stream.topPercent/100)
        var playerOptions = {
            'channel':  stream.channel,
            'width':    width,
            'height':   height
        }
        playerList[id] = new Twitch.Player(twitchContainer, playerOptions);
        playerList[id].showPlayerControls(false);
        playerList[id].setVolume(stream.volume);
        // if this sound is not on mute
        playerList[id].setMuted(id != soundOnTwitchStream.value);
        if (stream.paused) {
            playerList[id].pause();
        } else {
            playerList[id].play();
        }
        function getTwitchQualities() {
            const qual = playerList[id].getQualities();
            nodecg.log.info(qual);
            if (!qual || qual.length == 0) {
                setTimeout(getTwitchQualities, 500);
            }
            streamQualities.value[id] = qual;
            // set quality of stream to specified value if thats a valid quality for the stream
            if (streamQualities.value[id].includes(stream.quality)) {
                playerList[id].setQuality(strema.quality);
            } else {
                playerList[id].setQuality('chunked');
            }
        }
        // Twitch has a nice broken event system, if you request
        // the qualities if the stream claims to be ready, it isn't ready
        // play and playing are fired once every seconds so.. yea no
        playerList[id].addEventListener(Twitch.Player.READY, ()=>{
            getTwitchQualities();
        });
    }

    // check the delay for each stream and output it to the replicant
    setInterval(()=>{
        for (var i in playerList) {
            const curPlayer = playerList[i];
            if (curPlayer) {
                let stats = curPlayer.getPlaybackStats();
                if (stats) {
                    nodecg.log.info(JSON.stringify(stats));
                    streamDelay.value[i] = stats.hlsLatencyBroadcaster;
                }
            }
        }
    },delayCheckIntervalMs);
});