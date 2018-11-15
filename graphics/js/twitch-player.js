'use strict';
$(function() {
    // keeps track of which channel has sound, cause only one at a time can have sound, -1 is all muted
    var soundOnTwitchStream = nodecg.Replicant('sound-on-twitch-stream', {'persistent':false,'defaultValue':-1});
    // main control panel for streams
    var streams = nodecg.Replicant('twitch-streams', {'persistent':false,'defaultValue':[
        {'channel':'speedrunslive','width':400,'height':350,'quality':'chunked','volume':0,'paused':false,'hidden':true},
        {'channel':'speedrunslive','width':400,'height':350,'quality':'chunked','volume':0,'paused':false,'hidden':true},
        {'channel':'speedrunslive','width':400,'height':350,'quality':'chunked','volume':0,'paused':false,'hidden':true},
        {'channel':'speedrunslive','width':400,'height':350,'quality':'chunked','volume':0,'paused':false,'hidden':true},
    ]});
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
                if (oldStream.getQuality() != stream.quality) {
                    oldStream.setQuality(stream.quality);
                }
                if (oldStream.getVolume() != stream.volume) {
                    oldStream.setVolume(stream.volume);
                }
                if (oldStream.getChannel() != stream.channel) {
                    oldStream.setChannel(stream.channel);
                }
                const streamFrame = $('#twitch-player'+i+' iframe');
                if (streamFrame.attr('width') != stream.width) {
                    nodecg.log.info('Changing width');
                    streamFrame.attr('width',stream.width);
                }
                if (streamFrame.attr('height') != stream.height) {
                    streamFrame.attr('height',stream.height);
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
    //     // register listeners to remotely control streams
    //     // refresh TODO
    nodecg.listenFor('refreshStream',(id) => {
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
        var playerOptions = {
            'channel':  stream.channel,
            'width':    stream.width,
            'height':   stream.height,
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