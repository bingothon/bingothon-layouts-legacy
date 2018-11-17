'use strict';
$(function() {
    const bundleName = 'nodecg-speedcontrol';
    // keeps track of which channel has sound, cause only one at a time can have sound, -1 is all muted
    var soundOnTwitchStream = nodecg.Replicant('sound-on-twitch-stream', bundleName, {'persistent':false,'defaultValue':-1});
    // main control panel for streams
    var streams = nodecg.Replicant('twitch-streams', bundleName);
    // streams.values is an array that consists of elements with the following attributes;
    // channel, width, height, quality, volume, muted, paused, hidden
    var playerList = [];
    streams.on('change', (newStreams, oldStreams) => {
        for(var i in newStreams) {
            const stream = newStreams[i];
            // create player if it doesn't exists
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
    nodecg.listenFor('refreshStream',bundleName,(id) => {
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
        playerList[id].setQuality(stream.quality);
        playerList[id].setVolume(stream.volume);
        // if this sound is not on mute
        playerList[id].setMuted(id != soundOnTwitchStream.value);
        if (stream.paused) {
            playerList[id].pause();
        } else {
            playerList[id].play();
        }
    }
});