// "Track Mute For Note Output"
// Bitwig Studio controller script
// (c) 2015 Ch00rD 
// 
// Bitwig Studio controller script, intended to enable muting the note output 
// of non-audio tracks. This is achieved by linking the track mute state for 
// instrument tracks (i.e. non-audio tracks) in Bitwig Studio to the activation 
// state of tracks (/ channels).
// The (maximum) number of tracks (excluding master track and effect tracks) 
// being observed can be configured by the user. It is recommended to set this 
// to a relatively large number of tracks, at least as large as the total number 
// of tracks in (all) your projects.
// 
// (TODO:) A more sophisticated approach is planned, which only affects a track 
// if the first device in its chain is of the Note Filter type, and its preset 
// has some specific name, e.g. "Mute Notes").

loadAPI (1);

load ("TrackMuteForNoteOutput.config.js"); // Configuration editable by user in Bitwig Studio

host.defineController("Ch00rD", 
					  "Track Mute For Note Output", 
					  "0.1", 
					  "cc07d010-e2f0-11e4-b571-0800200c9a66", 
					  "Ch00rD"
					 );

// NB: Bitwig Studio seems to ignore a Controller Script with no MIDI input/output 
// configured - so just select a (virtual) MIDI input port that's not used/needed 
host.defineMidiPorts (0, 1);

// Declare arrays for storing information sent by various observers of things happening in Bitwig Studio
var trackExists = initArray(0, Config.tracksTotal);
var trackCanHoldNoteData = initArray(0, Config.tracksTotal); // Perhaps perform the inverse check instead: getCanHoldAudioData ?
var mute = initArray(0, Config.tracksTotal);
var mutePrevious = initArray(0, Config.tracksTotal);
// Support for solo is not yet implemented
// var solo = initArray(0, Config.tracksTotal);
var channelIsActivated = initArray(0, Config.tracksTotal);

/*
// NOT WORKING YET :p
// var cursorDevice = initArray(0, Config.tracksTotal);
// var cursorDeviceName = initArray(0, Config.tracksTotal);
// var trackDeviceBank = initArray(0, Config.tracksTotal);
// var trackFirstDeviceName = initArray(0, Config.tracksTotal);
*/

/*
// THIS (SIMPLISTIC) APPROACH WORKS, BUT DOES NOT DISCRIMINATE BETWEEN AUDIO VS. NON-AUDIO TRACKS
// If track mute status has changed, set channel activation status to inverse of track mute status
function getTrackMuteObserverFunc(index, varToStore)
{
   return function(value)
   {
	  // Reroute data directly into API
	  trackBank.getTrack(index).isActivated().set(!value);
   }
}
*/

// A function to create an indexed function for the Observers
function getValueObserverFunc(index, varToStore) {
    return function(value) {
        varToStore[index] = value;
    }
}

function init ()
{
	Config.init ();
	
	// a Trackbank is a set of tracks, sends and scenes in Bitwig exposed for control 
	// Only consider audio tracks, instrument tracks and hybrid tracks - ignore effect tracks and the master track
	trackBank = host.createMainTrackBank(Config.tracksTotal, 0, 0);

/*	// [TODO:]
	// Could be useful to avoid having to iterate through more tracks than necessary: 
	// ChannelBank --> addChannelCountObserver()
	// ...
	// 
	// Could be useful to avoid having to check track type (i.e. whether track can hold notes) when mute status changes: 
	// addTrackTypeObserver()
	// ...
*/
	// Iterate through the controllable tracks, create callback functions to get the required 
	// info from Bitwig Studio for later display/control, store info in arrays declared above
	for(var t=0; t<Config.tracksTotal; t++)
	{
		var track = trackBank.getTrack(t);
		
// 		THIS (SIMPLISTIC) APPROACH WORKS, BUT DOES NOT DISCRIMINATE BETWEEN AUDIO VS. NON-AUDIO TRACKS
// 		track.getMute().addValueObserver(getTrackMuteObserverFunc(t, mute));
 		
		// Slightly more sophisticated approach: check if track exists and can hold notes 
		track.exists().addValueObserver(getValueObserverFunc(t, trackExists));
		track.getCanHoldNoteData().addValueObserver(getValueObserverFunc(t, trackCanHoldNoteData));
		track.getMute().addValueObserver(getValueObserverFunc(t, mute));
		track.isActivated().addValueObserver(getValueObserverFunc(t, channelIsActivated));
		// Support for solo is not yet implemented
//		track.getSolo().addValueObserver(getValueObserverFunc(t, solo));
		
/*		
		// [TODO:] NOT WORKING YET :p
		// Even more sophisticated (but also more complex) approach: 
		// Instead of (de)activating tracks entirely, as currently implemented, 
		// it would arguably be a much better approach to use the observed track 
		// mute (and solo) state to switch on/off Note Filter devices (preferably with 
		// a specific preset name) that are placed at the very start of the chain in 
		// non-audio tracks, to make the mute button affect their output of notes.
		// 
		// --> Find 1st device / check for type 'note filter' and/or name e.g. 'MIDI Mute' or 'Note Mute'
		// ??? Not sure how to observe the name and enabled state of the 1st device in the device chain of a track/channel ???
		// ...
		
		// create a (minimal) Device Bank to observe the first device in its device chain
// 		track.createDeviceBank(1);
 		trackDeviceBank[t] = track.createDeviceBank(1);
		println("trackDeviceBank[" + t + "] = " + trackDeviceBank[t]);
		
// 		cursorDevice[t] = track.createCursorDevice("cursorDeviceForTrack" + t.toString());
		var cursorDeviceName = "cursorDeviceForTrack" + t.toString();
		cursorDevice[t] = track.createCursorDevice(cursorDeviceName);
 		println("cursorDevice[" + t + "] = " + cursorDevice[t]);
		
		// Cf. <http://www.kvraudio.com/forum/viewtopic.php?p=5933330#p5933278>
// 		cursorDevice.getChannelBank().getChannel(t).getDeviceBank().getDevice(0)
// 		cursorDevice[t] = trackDeviceBank[t].getDevice(0);
// 		println("cursorDevice[" + t + "] = " + cursorDevice[t]);
 		
// 		trackDeviceBank[t].getDevice(0).addNameObserver(getValueObserverFunc(t, trackFirstDeviceName));
// 		cursorDevice[t].selectFirstInChannel(t);
		
//		track.getChannelBank().getChannel(t).getDeviceBank().getDevice(0).addNameObserver(getValueObserverFunc(t, trackFirstDeviceName));
// 		trackDeviceBank[t].getDevice(0).addNameObserver(getValueObserverFunc(t, trackFirstDeviceName));

		// CursorDevice --> selectFirstInChannel ?
		// Device --> addNameObserver ?
		//        --> addIsEnabledObserver ?
		// PrimaryDevice.ChainLocation FIRST / LAST ?
		// toggleEnabledState() ?
		// ...
*/				
	}
	println("Initialized script: \"Track Mute For Note Output\"");
}

function exit ()
{
}

function flush ()
{
	for(var t=0; t<Config.tracksTotal; t++)
	{
// 		trackMuteStatusObject = trackBank.getTrack(t).getMute();
// 		println("Track " + (t+1) + " | exists: " + trackExists[t] + " | can hold note data: " + trackCanHoldNoteData[t] + " | mute: " + mute[t] + " | activated: " + channelIsActivated[t]);
		
		// Only consider tracks that exist (since we may check for a much 
		// larger number of tracks than the number of tracks actually used) 
		// and can also hold note data (i.e. ignore 'pure' audio tracks)
		if (trackExists[t] && trackCanHoldNoteData[t])
		{
// 			println("Track " + (t+1) + " | mute: " + mute[t] + " | activated: " + channelIsActivated[t]);
			
			// If track mute status has changed, set channel activation status to inverse of track mute status
			if (mute[t] != mutePrevious[t]) 
			{
				trackBank.getTrack(t).isActivated().set(!mute[t]);
				mutePrevious[t] = mute[t];
			}			
		}
	}
}
