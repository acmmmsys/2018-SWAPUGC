"use strict";
/*
    This file contains MSE-related functions
    It assumes that a MediaSource has been created (p.ms) and assigned a .v video element with a compatible .src
*/
var sourceBuffer;


//Adds a sourceBuffer when the p.ms is ready for the first time
function onSourceOpen(mime_codec) {

    if (p.v.canPlayType(mime_codec) == "") {
        logERR('Mime codec ' + mime_codec + ' is not supported. SourceBuffer will not be added to MSE');
    }

    if (p.ms.sourceBuffers.length > 0) {
        logWARN('onSourceOpen called with p.ms.sourceBuffers.length > 0');
        return;
    }

    sourceBuffer = p.ms.addSourceBuffer(mime_codec);
    sourceBuffer.ms = p.ms;

    sourceBuffer.addEventListener('onerror', function (e) {
        logERR('Error on sourceBuffer');
        logERR(e);
    }, {
        once: false
    });


    sourceBuffer.addEventListener('onabort', function (e) {
        logWARN('Abort ofsourceBuffer');
        logWARN(e);
    }, {
        once: false
    });


    //We also add the init element
    if (sourceBuffer.updating) {
        sourceBuffer.addEventListener('updateend', function () {
            fetch_res(DASH_DIR + '/' + globalSetIndex[PLAYLIST_MAIN_VIEW_INDEX].mpd.init_seg, addSegment, "arraybuffer");
        }, {
            once: true
        });
    } else {
        fetch_res(DASH_DIR + '/' + globalSetIndex[PLAYLIST_MAIN_VIEW_INDEX].mpd.init_seg, addSegment, "arraybuffer");
    }
}

//Append the initialization segment.
function addSegment(seg_in) {
    if (sourceBuffer.updating) {
        logWARN('sourceBuffer was updating when addSegment was called');
        return; //we return instead of setting a callback on "updateend" because we might have switched stream in the meantime
    }
    if (seg_in == null) {
        // Error fetching the initialization segment. Signal end of stream with an error.
        logERR("[ERROR] endofstream?");
        p.ms.endOfStream("network");
        return;
    }
    try {
        sourceBuffer.appendBuffer(seg_in);
    } catch (e) {
        logERR(e);
        resetSourceBuffer();
    }
    //    playlistPosition++;
    //    sourceBuffer.addEventListener('updateend', handleNextPlElement, { once: false });
}

//Returns the number of TimeRage objects of the SourceBuffer
function getSourceBufferTimeRangeNumber() {
    return sourceBuffer.buffered.length;
}

//Return the end time (in sec) of the SourceBuffer contents
function getSourceBufferEnd() {
    if (sourceBuffer.buffered.length === 0) {
        logWARN("SourceBuffer is empty (contains no TimeRanges");
        return -1;
    } else if (sourceBuffer.buffered.length > 1) {
        logWARN("SourceBuffer contains multiple TimeRanges - returning the end of the last one");
    }
    return sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
}

//Get/set timestamp offset for sourcebuffer
function getTimeStampOffset() {
    return sourceBuffer.timestampOffset;
}

function setTimeStampOffset(t_in) {
    sourceBuffer.timestampOffset = t_in;
}