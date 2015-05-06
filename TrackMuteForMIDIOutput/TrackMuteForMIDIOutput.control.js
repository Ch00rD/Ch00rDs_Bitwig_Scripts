// "Track Mute For MIDI Output"
// Bitwig Studio controller script
// (c) 2015 Ch00rD 
// 
// Bitwig Studio controller script, intended to enable muting the MIDI output 
// of non-audio tracks. This is achieved by (inversely) linking the track mute 
// state for "Instrument" type tracks in Bitwig Studio to their activation state. 
// 
// The (maximum) number of tracks (excluding master track and effect tracks) 
// being observed can be configured by the user. It is recommended to set this 
// to a relatively large number of tracks, at least as large as the total number 
// of tracks in (all) your projects.
// 
// WARNING: may (very occasionally) lead to 'hanging' notes sent between tracks 
// (similar to the classic 'hanging' MIDI notes problem), and also 'hanging' notes 
// within the native instrument devices (which seems to be of a slightly different 
// nature, as e.g. the *envelopes* of the notes also seem to be 'hanging' in some state). 
// 
// NB: A somewhat more sophisticated approach can be found in another script 
// (namely "TrackMuteForNoteFilters"), which only affects a track if the 
// "Primary" device in its chain is of the Note Filter type, and its preset 
// has some specific name, e.g. "Mute All Notes"). Note, however, that this 
// approach does *not* mute the output of any other (MIDI) events, such as 
// CCs, aftertouch, or pitch bend!
// Also see the "TrackMuteToTrackActivation_inverse" sibling script for a 
// less sophisticated approach, that *also* affects audio-only tracks. 
// WARNING: Do not use these scripts simultaneously!

loadAPI (1);

// Configuration editable by user in Bitwig Studio
load ("TrackMuteForMIDIOutput.config.js");

host.defineController("Ch00rD", 
					  "Track Mute For MIDI Output", 
					  "0.1", 
					  "cc07d010-e2f0-11e4-b571-0800200c9a66", 
					  "Ch00rD"
					 );

// NB: Bitwig Studio seems to ignore a Controller Script with no MIDI input/output 
// configured, so just (create and) select a (virtual) MIDI input port that's not used/needed 
host.defineMidiPorts (0, 1);

// Declare arrays for storing information sent by various observers of things happening in Bitwig Studio
var trackExists = initArray(0, Config.tracksMax);
var trackCanHoldNoteData = initArray(0, Config.tracksMax); // Perhaps perform the inverse check instead: getCanHoldAudioData ?
var mute = initArray(0, Config.tracksMax);
var mutePrevious = initArray(0, Config.tracksMax);
// Not really needed, only for debugging
var channelIsActivated = initArray(0, Config.tracksMax);
// Support for solo is not yet implemented
// var solo = initArray(0, Config.tracksMax);

// THIS (SIMPLISTIC) APPROACH WORKS, BUT DOES NOT DISCRIMINATE BETWEEN AUDIO VS. NON-AUDIO TRACKS
// If track mute status has changed, set channel activation status to inverse of track mute status
function getTrackMuteObserverFunc(index, varToStore)
{
   return function(isMuted)
   {
	  // Reroute data directly into API - no need to handle observed changes in flush () !
	  trackBank.getTrack(index).isActivated().set(!isMuted);
   }
}

// A function to create an indexed function for observers
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
	trackBank = host.createMainTrackBank(Config.tracksMax, 0, 0);

	// Iterate through the controllable tracks, create callback functions to get the required 
	// info from Bitwig Studio for later display/control, store info in arrays declared above
	for(var t=0; t<Config.tracksMax; t++)
	{
		var track = trackBank.getTrack(t);
		
// 		THIS (SIMPLISTIC) APPROACH WORKS, BUT DOES NOT DISCRIMINATE BETWEEN AUDIO VS. NON-AUDIO TRACKS
// 		track.getMute().addValueObserver(getTrackMuteObserverFunc(t, mute));
 		
		// Slightly more sophisticated approach: check if track exists and can hold notes 
		track.getMute().addValueObserver(getValueObserverFunc(t, mute));
		track.exists().addValueObserver(getValueObserverFunc(t, trackExists));
		track.getCanHoldNoteData().addValueObserver(getValueObserverFunc(t, trackCanHoldNoteData));
		// Not really needed, only for debugging
		track.isActivated().addValueObserver(getValueObserverFunc(t, channelIsActivated));
		// Support for solo is not yet implemented
//		track.getSolo().addValueObserver(getValueObserverFunc(t, solo));	
	}	
	println("Initialized script: \"Track Mute For MIDI Output\"");
}

function exit ()
{
}

function flush ()
{
	for(var t=0; t<Config.tracksMax; t++)
	{
		// Only consider tracks that exist (since we may check for a much 
		// larger number of tracks than the number of tracks actually used) 
		// and can also hold note data (i.e. ignore 'pure' audio tracks)
		if (trackExists[t] && trackCanHoldNoteData[t])
		{
			// If track mute status has changed, set channel activation status to inverse of track mute status
			if (mute[t] != mutePrevious[t]) 
			{
				// The "slightly more sophisticated [but still problematic] approach"
				trackBank.getTrack(t).isActivated().set(!mute[t]);
				mutePrevious[t] = mute[t]; // update previous value 
			}			
		}
	}
}
