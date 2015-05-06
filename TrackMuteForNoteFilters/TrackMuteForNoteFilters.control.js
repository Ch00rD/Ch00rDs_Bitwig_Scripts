// "Track Mute For Note Filters"
// Bitwig Studio controller script
// (c) 2015 Ch00rD 
// 
// Bitwig Studio controller script, intended to enable muting the note output 
// of non-audio tracks. This is achieved by linking the track mute state for 
// instrument tracks (i.e. non-audio tracks) in Bitwig Studio to the activation 
// state of Note Filter devices in specific tracks (only - for usability reasons),
// namely those which have been configured (by the Bitwig Studio user) as 
// "Primary" device for a track, and are using a preset named "Mute All Notes" 
// (which should be a preset that has both its (minimum and maximum) "velocity" 
// parameters set to 0). 
// 
// Note, however, that this approach does *not* mute the output of any other 
// (MIDI) events, such as CCs, aftertouch, or pitch bend!
// 
// Also note that this script needs to be reloaded whenever tracks are reordered, 
// as the "Primary" devices the script initially creates for specific tracks 
// 'stick' to those specific tracks, rather than a specific track number.
// 
// The (maximum) number of tracks (excluding master track and effect tracks) 
// being observed can be configured by the user. It is recommended to set this 
// to a relatively large number of tracks, at least as large as the total number 
// of tracks in (all) your projects.
// 
// NB: also see the "TrackMuteForNoteOutput" and "TrackMuteToTrackActivation_inverse" 
// sibling scripts for less sophisticated approaches, that disable the entire track, 
// and (for the latter) *also* affects audio-only tracks.
// WARNING: These scripts are intended as alternative approaches to a single issue. 
// Do not try to use more than one of these scripts simultaneously as this may lead 
// to unexpected results; this has not been tested. 

loadAPI (1);

// Configuration editable by user in Bitwig Studio
load ("TrackMuteForNoteFilters.config.js");

host.defineController("Ch00rD", 
					  "Track Mute For Note Filters", 
					  "0.1", 
					  "fa9558d0-e6dd-11e4-b571-0800200c9a66", 
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
var primaryDevice = initArray(0, Config.tracksMax);
var primaryDeviceName = initArray(0, Config.tracksMax); 		// <-- addNameObserver
var primaryDevicePresetName = initArray(0, Config.tracksMax); 	// <-- addPresetNameObserver
var primaryDeviceIsEnabled = initArray(0, Config.tracksMax);	// <-- addIsEnabledObserver
// Not used currently, except for debugging
var primaryDevicePosition = initArray(0, Config.tracksMax); 	// <-- addPositionObserver

// Useful?
var trackType = initArray(0, Config.tracksMax);					// <-- addTrackTypeObserver
var totalChannelCount = 0;

var trackPosition = initArray(0, Config.tracksMax);				// <-- addPositionObserver
var trackPositionPrevious = initArray(0, Config.tracksMax);

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
	
// 	app = host.createApplication();
// 	var actions = app.getActions();
//  	for (var i = 0; i < actions.length; i++) {
// 		println(actions[i].getName());
// 	}
	
	// a Trackbank is a set of tracks, sends and scenes in Bitwig exposed for control 
	// Only consider audio tracks, instrument tracks and hybrid tracks - ignore effect tracks and the master track
	trackBank = host.createMainTrackBank(Config.tracksMax, 0, 0);
	
	// Could be useful to avoid having to iterate through more tracks than necessary: 
	// Count total number of channels (tracks) in project
	trackBank.addChannelCountObserver(function(channels)
	{
		totalChannelCount = channels;
	});

	// Iterate through the controllable tracks, create callback functions to get the required 
	// info from Bitwig Studio for later display/control, store info in arrays declared above
	for (var t=0; t<Config.tracksMax; t++)
	{
		var track = trackBank.getTrack(t);
		
// 		THIS (SIMPLISTIC) APPROACH WORKS, BUT DOES NOT DISCRIMINATE BETWEEN AUDIO VS. NON-AUDIO TRACKS
// 		track.getMute().addValueObserver(getTrackMuteObserverFunc(t, mute));
		// try to do the same as above, but using an inline function?
 		
		// For slightly more sophisticated approach: check if track exists and can hold notes 
		track.getMute().addValueObserver(getValueObserverFunc(t, mute));
		track.exists().addValueObserver(getValueObserverFunc(t, trackExists));
		track.getCanHoldNoteData().addValueObserver(getValueObserverFunc(t, trackCanHoldNoteData));
		// Not really needed, only for debugging
		track.isActivated().addValueObserver(getValueObserverFunc(t, channelIsActivated));
		// Support for solo is not yet implemented
//		track.getSolo().addValueObserver(getValueObserverFunc(t, solo));	
		
		// Could be useful to avoid having to check track type (i.e. whether track can hold notes) when mute status changes: 
		track.addTrackTypeObserver(16, "Unassigned", (getValueObserverFunc(t, trackType)));
		
		// Even more sophisticated (but also more complex) approach: 
		// Instead of simply (de)activating tracks entirely, it is perhaps a much 
		// better approach to use the observed track mute state to switch on/off 
		// Note Filter devices with a specific preset name ("Mute All Notes") that 
		// are configured as 'Primary' device in 'Instrument' tracks, to make the 
		// mute button (also) affect the output of notes. 
		// 
		// Note, however, that this approach does *not* mute the output of any other 
		// (MIDI) events, such as CCs, aftertouch, or pitch bend! 
		// 
		// Also note that this script needs to be reloaded whenever tracks are 
		// reordered, as the "Primary" devices the script initially creates for 
		// specific tracks 'stick' to those specific tracks, rather than a specific 
		// track number.
		// 
		// Get 'Primary' device
		primaryDevice[t] = track.createCursorDevice("Primary");
		// Observer to check for device type, e.g. name = "Note filter"
		primaryDevice[t].addNameObserver(16, "Unassigned", (getValueObserverFunc(t, primaryDeviceName)));
		// Observer to check for preset name, e.g. 'Mute All Notes'
		primaryDevice[t].addPresetNameObserver(16, "Unassigned", (getValueObserverFunc(t, primaryDevicePresetName)));
		// Observer to check device position in chain
		primaryDevice[t].addPositionObserver(getValueObserverFunc(t, primaryDevicePosition));
		// Observer to check whether device is switched on or off
		primaryDevice[t].addIsEnabledObserver(getValueObserverFunc(t, primaryDeviceIsEnabled));
		
		track.addPositionObserver(getValueObserverFunc(t, trackPosition));
	}	
// 	println("Initialized script: \"Track Mute For Note Filters\"");
}

function exit ()
{
}

function flush ()
{
	// Don't look at more tracks than necessary: max = lowest number of either actual number of tracks or user-defined maximum
	var tMax = Math.min(totalChannelCount, Config.tracksMax);
	println("----- Total channel count = " + totalChannelCount + " | Configured maximum number of tracks: = " + Config.tracksMax + " --> highest track number to consider = " + tMax);
	
	// Check if tracks have been reordered
	var tracksHaveBeenReOrderered = false;
	for (var t=0; t<tMax; t++)
	{
		// When a track has been reordered...
		println("track: " + t + " | trackPosition[t] = " + trackPosition[t] + " | trackPositionPrevious[t] = " + trackPositionPrevious[t]);
 		if (trackPosition[t] !== trackPositionPrevious[t]) 
		{
// 			if (trackPositionPrevious[t] !== 0) {
				tracksHaveBeenReOrderered = true;
				println("[check] track: " + t + " | trackPosition[t] = " + trackPosition[t] + " | trackPositionPrevious[t] = " + trackPositionPrevious[t]);
// 			}
			trackPositionPrevious[t] = trackPosition[t];
		}
	}
	println("--> tracksHaveBeenReOrderered = " + tracksHaveBeenReOrderered);
	if (tracksHaveBeenReOrderered === true) {
		for (var t=0; t<tMax; t++)
		{
			println("[reorder] track: " + t + " | trackPosition[t] = " + trackPosition[t] + " | trackPositionPrevious[t] = " + trackPositionPrevious[t] + " | mutePrev: " + mutePrevious[t]);
			mute[t] = trackBank.getTrack(t).getMute();
			mutePrevious[t] = mute[t];
		}
	}

// 			println("trackPosition[t] = " + trackPosition[t] + " | trackPositionPrevious[t] = " + trackPositionPrevious[t]);
			
// 			host.showPopupNotification("Tracks have been reordered; \nthe script \"TrackMuteForNoteFilters\" may need to be reloaded!");
			// Update "Primary" device and its observers for this track
// 			primaryDevice[t] = trackBank.getTrack(t).createCursorDevice("Primary");
/*			// Observer to check for device type, e.g. name = "Note filter"
			primaryDevice[t].addNameObserver(16, "Unassigned", (getValueObserverFunc(t, primaryDeviceName)));
			// Observer to check for preset name, e.g. 'Mute All Notes'
			primaryDevice[t].addPresetNameObserver(16, "Unassigned", (getValueObserverFunc(t, primaryDevicePresetName)));
			// Observer to check device position in chain
			primaryDevice[t].addPositionObserver(getValueObserverFunc(t, primaryDevicePosition));
			// Observer to check whether device is switched on or off
			primaryDevice[t].addIsEnabledObserver(getValueObserverFunc(t, primaryDeviceIsEnabled));
*/			

	for(var t=0; t<tMax; t++)
	{
		// Only consider tracks of the "Instrument" type (i.e. ignore "Audio" and "Hybrid" tracks)
		if (trackType[t] === "Instrument")
		{
// 			println("Track " + (t+1) + " | mute: " + mute[t] + " | activated: " + channelIsActivated[t]);
// 			println("Track " + (t+1) + " > Primary Device: " + primaryDeviceName[t] + " | Preset Name: " + primaryDevicePresetName[t] + " | Device Position: " + (primaryDevicePosition[t]+1)  + " | Enabled: " + primaryDeviceIsEnabled[t]);

			// If track mute status has changed...
			if (mute[t] != mutePrevious[t]) 
			{
				// The "slightly more sophisticated [but still problematic] approach":
				// set channel activation status to inverse of track mute status
// 				trackBank.getTrack(t).isActivated().set(!mute[t]);
				
				// Get primary device, check for required device type and preset name
// 				var pd = trackBank.getTrack(t).getPrimaryDevice();
// 				dump("primaryDevice = " + pd)
//				pd.toggleEnabledState(); // ?? toggleEnabledState() works, but is not mentioned in dump of object ???
				// THIS DOES NOT WORK! BUT ... WHY? DeviceType() is mentioned as a class under PrimaryDevice
// 				var pdType = pd.DeviceType();
				
				// Update "Primary" device for track in case tracks have been reordered
// 				primaryDevice[t] = trackBank.getTrack(t).createCursorDevice("Primary");

 				if (primaryDeviceName[t] === "Note Filter" && primaryDevicePresetName[t] === "Mute All Notes") {
					// Toggle enabled state
					if (mute[t] === true && primaryDeviceIsEnabled[t] === false) {
						primaryDevice[t].toggleEnabledState();
// 						println("MUTE Track " + (t+1) + " > ENABLING Primary Device: Note Filter (Preset \"Mute All Notes\")");
					}
					else if (mute[t] === false && primaryDeviceIsEnabled[t] === true) {
						primaryDevice[t].toggleEnabledState();
// 						println("UNMUTE Track " + (t+1) + " > DISABLING Primary Device: Note Filter (Preset \"Mute All Notes\")");
					}
				}
				mutePrevious[t] = mute[t]; // update previous value 
			}			
		}
	}
}
