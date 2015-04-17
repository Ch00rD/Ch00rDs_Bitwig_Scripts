// "Track Mute To Track Activation - Inverse"
// Bitwig Studio controller script
// (c) 2015 Ch00rD 
// 
// Bitwig Studio controller script, intended to enable muting the note output 
// of note-only tracks. However, this is achieved in a VERY QUICK AND DIRTY 
// manner, by linking the track mute state for FOR ALL TRACKS (i.e. also audio-only 
// tracks) in Bitwig Studio to the activation state of tracks (/ channels). 
// 
// The (maximum) number of tracks (excluding master track and effect tracks) 
// being observed can be configured by the user. It is recommended to set this 
// to a relatively small number of tracks, reserve the same amount of tracks 
// in (all) your projects for notes-only tracks, and keeping them at the top. 
// 
// WARNING: may lead to 'hanging' notes sent between tracks (similar to 'hanging' 
// MIDI notes), and also 'hanging' notes within the native instrument devices 
// (which is a bit different; the *envelopes* of the notes also seem to 'hang'). 
// 
// NB: also see the "TrackMuteForNoteOutput" sibling script for a slightly more 
// sophisticated approach, that does *not* affect audio-only tracks. 
// WARNING: Do not use these two scripts simultaneously!

loadAPI (1);

// ------------------------------
// Editable configuration
// ------------------------------

// Total number of tracks (excluding master track and effect tracks) being observed; 
// perhaps best to use a relatively small number of tracks, reserve the same amount of tracks 
// in (all) your projects for notes-only tracks, and keeping them at the top. 
NUM_TRACKS = 16;

// ------------------------------

host.defineController("Ch00rD", 
					  "Track Mute To Track Activation - Inverse", 
					  "0.1", 
					  "cd729300-e506-11e4-b571-0800200c9a66", 
					  "Ch00rD"
					 );

// NB: Bitwig Studio seems to ignore a Controller Script with no MIDI input/output 
// configured, so just (create and) select a (virtual) MIDI input port that's not used/needed 
host.defineMidiPorts (0, 1);

// Declare array for storing information sent by observers
var mute = initArray(0, NUM_TRACKS);

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

function init ()
{
	// a Trackbank is a set of tracks, sends and scenes in Bitwig exposed for control 
	// Only consider audio tracks, instrument tracks and hybrid tracks - ignore effect tracks and the master track
	trackBank = host.createMainTrackBank(NUM_TRACKS, 0, 0);

	// Iterate through the controllable tracks, create callback functions in array declared above
	for(var t=0; t<NUM_TRACKS; t++)
	{
		var track = trackBank.getTrack(t);
// 		THIS (SIMPLISTIC) APPROACH WORKS, BUT DOES NOT DISCRIMINATE BETWEEN AUDIO VS. NON-AUDIO TRACKS
		track.getMute().addValueObserver(getTrackMuteObserverFunc(t, mute));
		// try to do the same as above, but using an inline function?
	}
// 	println("Initialized script: \"Track Mute To Track Activation - Inverse\"");
}

function exit ()
{
}
