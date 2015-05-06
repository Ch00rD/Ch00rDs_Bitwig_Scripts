//  Ch00rD's fork of Thonas Helzle's "TomsMultiBiController" script
//  
//  Enhanced Generic Controller Script for Bitwig Studio with support for:
//  - All 16 individual MIDI Channels + Omni mode as separate input ports
//  - Mapping Poly Aftertouch to Expression
//  - CCs fully mappable per MIDI Channel
//  - 14-bit CC pairs (per MIDI specs: CC 0-31/32-63 = MSB/LSB), with (optional) support for 
//    7-bit input (i.e. MSB only) to 14-bit mappings (NB: 7-bit LSB only input is always supported) 
//  - 7-bit CCs (starting above highest 14-bit LSB CC used)
//  - Sending feedback for mapped CCs to the controller device (useful for LEDs, motorized faders, etc.)
//  - MIDI Beat Clock output (optional: can be disabled by commenting out a single line, see below)
//  - [EXPERIMENTAL] Linking notes to CCs with same number to switch back to automation playback, 
//    reset mapped parameters to their default values, or support touch-sensitive automation recording

/*  DEVELOPMENT NOTES: 
    
    Some things that may be useful (or not... ?) to implement better support for 14-bit CC pairs:
    - For processing a MSB (almost) immediately followed a corresponding LSB, a timer function 
      (i.e. host.scheduleTask) could perhaps be used to make the script wait for a few ms after 
      receiving a 14 bit MSB CC message and check if a LSB has been received meanwhile;
      the mapped parameter value can then be set even when no LSB is received shortly after the MSB, 
      simultaneously supporting plain 7-bit input (i.e. 'coarse tune' mode) as well as 14-bit, 
      while avoiding setting the mapped parameter value twice, both when a MSB and a LSB message 
      is received (also see comment below in the onMidi() function re: commenting out the line 
      which sets the parameter value on reception of a MSB CC message). When processing 'orphan' 
      LSB messages (as required per the MIDI specs), it may also be useful to somehow reset/cancel 
      such a timer function.

*/

loadAPI(1);

// Some user-adjustable variables to define the ranges used for 14-bit CC pairs vs. plain 7-bit CCs
// CCs 0/32 (= Bank Select MSB/LSB) are best avoided, just to be sure; YMMV
var LOWEST_14bitMSB_CC = 0;
var HIGHEST_14bitMSB_CC = 31;
// Max. resolution for 14-bit CCs = 16384 steps (0-16383); can be set to lower value, e.g. 
// set to 10001 for a better match to values displayed as percentages (0.00% to 100.00%)
var RESOLUTION_14_BIT = 16384;
// Make sure not to use overlapping CC number ranges for 14-bit and 7-bit! (prints warning to Controller Script Console)
// Best avoid CC 0-63, reserving that range exclusively for 14-bit CC pairs 
// CCs 120+ are best avoided completely as well, as these may easily cause issues; YMMV
var LOWEST_7bit_CC = 64;
var HIGHEST_7bit_CC = 119; 
// Max. resolution for 7-bit CCs = 128 steps (0-127); can be set to lower value, e.g. 
// set to 101 for a better match to values displayed as percentages (0.00% to 100%)
var RESOLUTION_7_BIT = 128;

// MIDI notes
var LOWEST_NOTE = 0;
var HIGHEST_NOTE = 120; 

// Link (index of) MIDI note numbers to (index of) mapped CCs to enable various functions
var LINK_NOTES_TO_CCS = true;

// Enable/disable sending MIDI Beat Clock from Bitwig Studio to the output connected to the MIDI controller device
// NB: may affect performance negatively - it is recommended to disable this if you don't need it; YMMV
var SEND_MIDI_BEAT_CLOCK = false;

// Print SysEx messages received from the controller to the Controller Script Console in Bitwig Studio; 
// NB: may affect performance negatively - it is recommended to disable this if you don't need it; YMMV
var LOG_SYSEX = false;

// Print various bits of information to the Controller Script Console for debugging purposes
// NB: may affect performance negatively - it is recommended to disable this if you don't need it; YMMV
var DEBUG = false;

//  ----------------------------------------------------------------------------

// Do not tweak the variables below if you don't know what you're doing! :p

// Calculate array sizes for storage of current and last previous value for each CC
// 14-bit MSB/LSB CC pairs
var LOWEST_14bitLSB_CC = LOWEST_14bitMSB_CC + 32;
var HIGHEST_14bitLSB_CC = HIGHEST_14bitMSB_CC + 32;
var HIGH_RES_CC_RANGE = HIGHEST_14bitMSB_CC - LOWEST_14bitMSB_CC + 1;
if (DEBUG) println("LOWEST_14bitMSB_CC = " + LOWEST_14bitMSB_CC + " | HIGHEST_14bitMSB_CC = " + HIGHEST_14bitMSB_CC + " --> HIGH_RES_CC_RANGE = " + HIGH_RES_CC_RANGE);
var ccPairValue = initArray(0, (HIGH_RES_CC_RANGE * 16));
var ccPairValueOld = initArray(0, (HIGH_RES_CC_RANGE * 16));
// 7-bit CCs
var LOW_RES_CC_RANGE = HIGHEST_7bit_CC - LOWEST_7bit_CC + 1;
if (DEBUG) println("LOWEST_7bit_CC = " + LOWEST_7bit_CC + " | HIGHEST_7bit_CC = " + HIGHEST_7bit_CC + " --> LOW_RES_CC_RANGE = " + LOW_RES_CC_RANGE);
var ccValue = initArray(0, (LOW_RES_CC_RANGE * 16));
var ccValueOld = initArray(0, (LOW_RES_CC_RANGE * 16));
// Notes
var NOTE_RANGE = HIGHEST_NOTE - LOWEST_NOTE + 1;
if (DEBUG) println("LOWEST_NOTE = " + LOWEST_NOTE + " | HIGHEST_NOTE = " + HIGHEST_NOTE + " --> NOTE_RANGE = " + NOTE_RANGE);
var noteValue = initArray(0, (NOTE_RANGE * 16));
var noteValueOld = initArray(0, (NOTE_RANGE * 16));

host.defineController("Ch00rD", 
                      "7/14-bit CC Controller", 
                      "1.0", 
                      "9d51fc50-e057-11e4-b571-0800200c9a66", 
                      "Ch00rD"
                     );
host.defineMidiPorts(1, 1);
// host.addDeviceNameBasedDiscoveryPair(["BCR 2000 Port 1"], ["BCR 2000 Port 1"]);
// host.addDeviceNameBasedDiscoveryPair(["BCR 2000 port 1"], ["BCR 2000 port 1"]);

// A function to create an indexed function for the Observers
function getValueObserverFunc(index, varToStore) {
    return function(value) {
        varToStore[index] = value;
    }
}

function init() {
    if (LOWEST_7bit_CC <= HIGHEST_14bitLSB_CC) host.errorln("WARNING: configured 14-bit CC range overlapping with 7-bit CC range!\nPlease adjust your script settings to avoid errors!");
    
    // Create NoteInputs for Omni + 16 MIDI channels; 
    // Disable the consuming of the events by the NoteInputs, so they are also available for mapping;
    // Enable Poly AT translation into Timbre for the internal Bitwig Studio instruments
    // 
    // Verbose to allow commenting out unneeded channels
//  HiLoResCCs0 = host.getMidiInPort(0).createNoteInput("Omni", "??????");
//  HiLoResCCs0.setShouldConsumeEvents(false);
//  HiLoResCCs0.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs1 = host.getMidiInPort(0).createNoteInput("Ch 1", "?0????");
    HiLoResCCs1.setShouldConsumeEvents(false);
    HiLoResCCs1.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs2 = host.getMidiInPort(0).createNoteInput("Ch 2", "?1????");
    HiLoResCCs2.setShouldConsumeEvents(false);
    HiLoResCCs2.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs3 = host.getMidiInPort(0).createNoteInput("Ch 3", "?2????");
    HiLoResCCs3.setShouldConsumeEvents(false);
    HiLoResCCs3.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs4 = host.getMidiInPort(0).createNoteInput("Ch 4", "?3????");
    HiLoResCCs4.setShouldConsumeEvents(false);
    HiLoResCCs4.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs5 = host.getMidiInPort(0).createNoteInput("Ch 5", "?4????");
    HiLoResCCs5.setShouldConsumeEvents(false);
    HiLoResCCs5.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs6 = host.getMidiInPort(0).createNoteInput("Ch 6", "?5????");
    HiLoResCCs6.setShouldConsumeEvents(false);
    HiLoResCCs6.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs7 = host.getMidiInPort(0).createNoteInput("Ch 7", "?6????");
    HiLoResCCs7.setShouldConsumeEvents(false);
    HiLoResCCs7.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs8 = host.getMidiInPort(0).createNoteInput("Ch 8", "?7????");
    HiLoResCCs8.setShouldConsumeEvents(false);
    HiLoResCCs8.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs9 = host.getMidiInPort(0).createNoteInput("Ch 9", "?8????");
    HiLoResCCs9.setShouldConsumeEvents(false);
    HiLoResCCs9.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs10 = host.getMidiInPort(0).createNoteInput("Ch 10", "?9????");
    HiLoResCCs10.setShouldConsumeEvents(false);
    HiLoResCCs10.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs11 = host.getMidiInPort(0).createNoteInput("Ch 11", "?A????");
    HiLoResCCs11.setShouldConsumeEvents(false);
    HiLoResCCs11.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs12 = host.getMidiInPort(0).createNoteInput("Ch 12", "?B????");
    HiLoResCCs12.setShouldConsumeEvents(false);
    HiLoResCCs12.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs13 = host.getMidiInPort(0).createNoteInput("Ch 13", "?C????");
    HiLoResCCs13.setShouldConsumeEvents(false);
    HiLoResCCs13.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs14 = host.getMidiInPort(0).createNoteInput("Ch 14", "?D????");
    HiLoResCCs14.setShouldConsumeEvents(false);
    HiLoResCCs14.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs15 = host.getMidiInPort(0).createNoteInput("Ch 15", "?E????");
    HiLoResCCs15.setShouldConsumeEvents(false);
    HiLoResCCs15.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);
    
    HiLoResCCs16 = host.getMidiInPort(0).createNoteInput("Ch 16", "?F????");
    HiLoResCCs16.setShouldConsumeEvents(false);
    HiLoResCCs16.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);

    // Enable MIDI Beat Clock
    host.getMidiOutPort(0).setShouldSendMidiBeatClock(SEND_MIDI_BEAT_CLOCK);

    // Set callbacks for (plain) MIDI and SysEx
    host.getMidiInPort(0).setMidiCallback(onMidi);
    if (LOG_SYSEX)host.getMidiInPort(0).setSysexCallback(onSysex);

    if (DEBUG) println("Creating " + ((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE + NOTE_RANGE)*16) + " User Control(s) and corresponding Value Observer(s) ... ");
    userControls = host.createUserControls((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE + NOTE_RANGE)*16);
    
    // 14-bit CC pairs
    for (var i = LOWEST_14bitMSB_CC; i <= HIGHEST_14bitMSB_CC; i++) {
        for (var j = 1; j <= 16; j++) {
            // Create the index variable c
            var c = i - LOWEST_14bitMSB_CC + (j-1) * HIGH_RES_CC_RANGE;
//          if (DEBUG) println("[14-bit] i = " + i + " | MIDI Ch. = " + j + " | c (index) = " + c);
            // Set a label/name for each userControl
            userControls.getControl(c).setLabel("CC " + i + "+" + (i+32) + " (14-bit) MIDI Ch. " + j);
            // Add a ValueObserver for each userControl
            userControls.getControl(c).addValueObserver(RESOLUTION_14_BIT, getValueObserverFunc(c, ccPairValue));
            userControls.getControl(c).setIndication(true);
        }
    }
    
    // 7-bit CC messages
    for (var i = LOWEST_7bit_CC; i <= HIGHEST_7bit_CC; i++) {
        for (var j = 1; j <= 16; j++) {
            // Create the index variable c
            var c = (HIGH_RES_CC_RANGE * 16) + i - LOWEST_7bit_CC + (j-1) * LOW_RES_CC_RANGE;
//          if (DEBUG) println("[7-bit] i = " + i + " | MIDI Ch. = " + j + " | c (index) = " + c);
            // Set a label/name for each userControl
            userControls.getControl(c).setLabel("CC " + i + " (7bit) MIDI Ch. " + j);
            // Add a ValueObserver for each userControl
            userControls.getControl(c).addValueObserver(RESOLUTION_7_BIT, getValueObserverFunc(c, ccValue));
            userControls.getControl(c).setIndication(true);
        }
    }
    
    // Notes
    for (var i = LOWEST_NOTE; i <= HIGHEST_NOTE; i++) {
        for (var j = 1; j <= 16; j++) {
            // Create the index variable n
            var n = ((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE) * 16) + i - LOWEST_NOTE + (j-1) * NOTE_RANGE;
//          if (DEBUG) println("[note] i = " + i + " | MIDI Ch. = " + j + " | n = " + n);
			// Set a label/name for each userControl
			userControls.getControl(n).setLabel("Note " + i + " MIDI Ch. " + j);
			// Add a ValueObserver for each userControl
			userControls.getControl(n).addValueObserver(128, getValueObserverFunc(n, noteValue));
            userControls.getControl(c).setIndication(true);
        }
    }
    if (DEBUG) println("---------- FINISHED INITIALIZATION ----------");
}

// Updates the controller in an orderly manner when needed, so that the MIDI controller's 
// LEDs, motorized faders etc. react to changes in Bitwig Studio (e.g. by using its GUI, 
// automation, or modulation) without drowning the Controller with data ('flooding')
function flush() {
    // Handle 14-bit CC pairs
    for (var i=LOWEST_14bitMSB_CC; i<=HIGHEST_14bitMSB_CC; i++) {
        for (var j=1; j<=16; j++) {
            var c = i - LOWEST_14bitMSB_CC + (j-1) * HIGH_RES_CC_RANGE;
            // Check if something has changed
            if (ccPairValue[c] != ccPairValueOld[c]) {
                // If yes, send the updated value
                if (DEBUG) println("[14-bit CC] i = " + i + " / " + (i+32) + " | MIDI Ch. = " + j + " | c = " + c + " | ccPairValue[c]: " + ccPairValue[c] + " --> MSB|LSB: " + ((ccPairValue[c] >> 7) & 0x7F) + "|" + (ccPairValue[c] & 0x7F));
                sendChannelController(j-1, i, (ccPairValue[c] >> 7) & 0x7F); // send MSB
                sendChannelController(j-1, i+32, ccPairValue[c] & 0x7F); // send LSB
                // And update the value for the next check
                ccPairValueOld[c] = ccPairValue[c];
            }
        }
    }
    
    // Handle 7-bit CCs
    for (var i=LOWEST_7bit_CC ; i<=HIGHEST_7bit_CC; i++) {
        for (var j=1; j<=16; j++) {
            var c = (HIGH_RES_CC_RANGE * 16) + i - LOWEST_7bit_CC + (j-1) * LOW_RES_CC_RANGE;
            // Check if something has changed
            if (ccValue[c] != ccValueOld[c]) {
                // If yes, send the updated value
                if (DEBUG) println("[7-bit CC] i = " + i + " | MIDI Ch. = " + j + " | c = " + c + " | ccValue[c]: " + ccValue[c]);
                sendChannelController(j-1, i, ccValue[c]);
                // And update the value for the next check
                ccValueOld[c] = ccValue[c];
            }
        }
    }

    // Handle notes
    for (var i=LOWEST_NOTE ; i<=HIGHEST_NOTE; i++) {
        for (var j=1; j<=16; j++) {
            var n = ((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE) * 16) + i - LOWEST_NOTE + (j-1) * NOTE_RANGE;
            // Check if something has changed
            if (noteValue[n] != noteValueOld[n]) {
                // If yes, send the updated value
                if (DEBUG) println("[note] i = " + i + " | MIDI Ch. = " + j + " | n = " + n + " | noteValue[n]: " + noteValue[n]);
                sendNoteOn(j-1, i, noteValue[n])
                // And update the value for the next check
                noteValueOld[n] = noteValue[n];
            }
        }
    }
}

// Update the UserControls when MIDI data is received
function onMidi(status, data1, data2) {
    if (DEBUG) printMidi(status, data1, data2);

    // Handle MIDI continuous controllers (CCs)
    if (isChannelController(status)) {
        // Handle 7-bit CCs
        if (data1 >= LOWEST_7bit_CC && data1 <= HIGHEST_7bit_CC) {
            var index = (HIGH_RES_CC_RANGE * 16) + data1 - LOWEST_7bit_CC + (LOW_RES_CC_RANGE * MIDIChannel(status));
            userControls.getControl(index).set(data2, RESOLUTION_7_BIT);
            if (DEBUG) println("[7-bit CC] index = " + index + " | MIDI Channel: " + (MIDIChannel(status) + 1) + " | CC: " + data1 + " | value: " + data2);
        }
        // Handle 14-bit CC pairs
        // MSB
        if (data1 >= LOWEST_14bitMSB_CC && data1 <= HIGHEST_14bitMSB_CC) {
            var index = data1 - LOWEST_14bitMSB_CC + (HIGH_RES_CC_RANGE * MIDIChannel(status));
            // Get LSB from current value, add new MSB (= data2), store new 14-bit value
            var current_LSB = ccPairValue[index] & 0x7F;
//          var new_14bit_value = (data2 << 7) + current_LSB;
            var new_14bit_value = (data2 << 7) | current_LSB; // bitwise operator may be slightly faster?
            ccPairValue[index] = ccPairValueOld[index] = new_14bit_value;
            // NB: The line below results is setting the value *twice* when a 14-bit CC pair is received;
            // It is necessary to support 7-bit CC messages (which may e.g. be useful to quickly swap between low and 
            // high resolution patches on the controller's end), however, if only strict 14-bit functionality is required,
            // it is recommended to comment it out, so the value is only set *after* a LSB message has been received
            // (including 'orphan' LSB messages, as required by the MIDI specs). 
//             userControls.getControl(index).set(new_14bit_value, RESOLUTION_14_BIT);
            if (DEBUG) println("[14-bit CC: MSB] index = " + index + " | MIDI Channel: " + (MIDIChannel(status) + 1) + " | CC: " + data1 + " | value: " + data2);

        }
        // LSB
        if (data1 >= LOWEST_14bitLSB_CC && data1 <= HIGHEST_14bitLSB_CC) {
            var index = data1 - LOWEST_14bitLSB_CC + (HIGH_RES_CC_RANGE * MIDIChannel(status));
            // Get MSB from current value, add new LSB (= data2), store new 14-bit value
            var current_MSB = (ccPairValue[index] >> 7) & 0x7F;
//          var new_14bit_value = (current_MSB << 7) + data2;
            var new_14bit_value = (current_MSB << 7) | data2; // bitwise operator may be slightly faster than addition?
            ccPairValue[index] = ccPairValueOld[index] = new_14bit_value;
            userControls.getControl(index).set(new_14bit_value, RESOLUTION_14_BIT);
            if (DEBUG) println("[14-bit CC: LSB] index = " + index + " | MIDI Channel: " + (MIDIChannel(status) + 1) + " | CC: " + data1 + " | value: " + data2 + " --> 14-bit: " + new_14bit_value);
        }
    }
    // Handle MIDI notes
    // function isNoteOff(status, data2) { return ((status & 0xF0) == 0x80) || ((status & 0xF0) == 0x90 && data2 == 0); }
	// function isNoteOn(status) { return (status & 0xF0) == 0x90; }
	// Handle note-on events
    if (isNoteOn(status)) {
        if (data1 >= LOWEST_NOTE && data1 <= HIGHEST_NOTE) {
            var index = ((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE) * 16) + data1 - LOWEST_NOTE + (NOTE_RANGE * MIDIChannel(status));
            userControls.getControl(index).set(data2, 128);
            if (DEBUG) println("[note-on] index = " + index + " | MIDI Channel: " + (MIDIChannel(status) + 1) + " | note: " + data1 + " | velocity: " + data2);
			// [TODO:] add 'modifier' buttons; better support for 'real' note-off events
            // Link (index of) MIDI note numbers to (index of) mapped CCs to enable various functions
            if (LINK_NOTES_TO_CCS) {
				var linkedCC = (index - ((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE) * 16));
				// Safety check: is there a configured CC with the same number as this note's number?
				if ((linkedCC >= LOWEST_14bitMSB_CC && linkedCC <= HIGHEST_14bitMSB_CC) || (data1 >= LOWEST_7bit_CC && data1 <= HIGHEST_7bit_CC)) {
					if (DEBUG) println("MIDI Channel " + (MIDIChannel(status) + 1) + " | note number " + data1 + " (velocity: " + data2 + ") --> linked to: " + userControls.getControl(linkedCC).getLabel());
					// Restore automation control (i.e. change green dot on mapped controller assignment back to blue dot)
					if (data2 > 0) userControls.getControl(linkedCC).restoreAutomationControl();
			
					// Touch-sensitive automation recording
					// userControls.getControl(linkedCC).touch(data2 > 0);
			
					// Reset to default value
					// if (data2 > 0) userControls.getControl(linkedCC).reset();
            	}
            }
        }
    }
	// Handle note-off events; always send 0, even when non-zero note-off velocity is received 
    if (isNoteOff(status)) {
        if (data1 >= LOWEST_NOTE && data1 <= HIGHEST_NOTE) {
            var index = ((HIGH_RES_CC_RANGE + LOW_RES_CC_RANGE) * 16) + data1 - LOWEST_NOTE + (NOTE_RANGE * MIDIChannel(status));
            userControls.getControl(index).set(0, 128);
            if (DEBUG) println("[note-off] index = " + index + " | MIDI Channel: " + (MIDIChannel(status) + 1) + " | note: " + data1 + " | velocity: " + data2);
        }
    }
}

function onSysex(data) {
    if (LOG_SYSEX) printSysex(data);
}

function exit() {
    // nothing to see here :-)
}
