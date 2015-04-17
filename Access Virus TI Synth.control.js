// Bitwig Studio controller script for Access Virus TI Synth
// by Ch00rD

loadAPI(1);

host.defineController("Access Music", "Virus TI Synth", "1.0", "d9007430-e51f-11e4-b571-0800200c9a66");
host.defineMidiPorts(1, 0);
host.addDeviceNameBasedDiscoveryPair(["Virus TI Synth"], ["Virus TI Synth"]);

// Some user-adjustable variables to define the ranges used for (plain 7-bit) CCs
var LOWEST_CC = 1;
var HIGHEST_CC = 119; 
// Max. resolution for 7-bit CCs = 128 steps (0-127); can be set to lower value, e.g. 
// set to 101 for a better match to values displayed as percentages (0.00% to 100%)
var RESOLUTION_7_BIT = 128;

// Print SysEx messages received from the controller to the Controller Script Console in Bitwig Studio; 
// NB: may affect performance negatively - it is recommended to disable this if you don't need it; YMMV
var LOG_SYSEX = false;

//  ----------------------------------------------------------------------------

// Do not tweak the variables below if you don't know what you're doing! :p

// Calculate array sizes for storage of current and last previous value for each CC
var CC_RANGE = (HIGHEST_CC - LOWEST_CC + 1);
var ccValue = initArray(0, (CC_RANGE * 16));
var ccValueOld = initArray(0, (CC_RANGE * 16));

function init()
{
    // Set callbacks for (plain) MIDI and SysEx
    host.getMidiInPort(0).setMidiCallback(onMidi);
    if (LOG_SYSEX)host.getMidiInPort(0).setSysexCallback(onSysex);
    
    // Create NoteInputs for Omni + 16 MIDI channels; 
    // Disable the consuming of the events by the NoteInputs, so they are also available for mapping
    // Verbose to allow commenting out unneeded channels
    Virus   = host.getMidiInPort(0).createNoteInput("Omni", "??????");
    Virus.setShouldConsumeEvents(false);
    Virus1  = host.getMidiInPort(0).createNoteInput("Ch 1", "?0????");
    Virus1.setShouldConsumeEvents(false);
    Virus2  = host.getMidiInPort(0).createNoteInput("Ch 2", "?1????");
    Virus2.setShouldConsumeEvents(false);
    Virus3  = host.getMidiInPort(0).createNoteInput("Ch 3", "?2????");
    Virus3.setShouldConsumeEvents(false);
    Virus4  = host.getMidiInPort(0).createNoteInput("Ch 4", "?3????");
    Virus4.setShouldConsumeEvents(false);
    Virus5  = host.getMidiInPort(0).createNoteInput("Ch 5", "?4????");
    Virus5.setShouldConsumeEvents(false);
    Virus6  = host.getMidiInPort(0).createNoteInput("Ch 6", "?5????");
    Virus6.setShouldConsumeEvents(false);
    Virus7  = host.getMidiInPort(0).createNoteInput("Ch 7", "?6????");
    Virus7.setShouldConsumeEvents(false);
    Virus8  = host.getMidiInPort(0).createNoteInput("Ch 8", "?7????");
    Virus8.setShouldConsumeEvents(false);
    Virus9  = host.getMidiInPort(0).createNoteInput("Ch 9", "?8????");
    Virus9.setShouldConsumeEvents(false);
    Virus10 = host.getMidiInPort(0).createNoteInput("Ch 10", "?9????");
    Virus10.setShouldConsumeEvents(false);
    Virus11 = host.getMidiInPort(0).createNoteInput("Ch 11", "?A????");
    Virus11.setShouldConsumeEvents(false);
    Virus12 = host.getMidiInPort(0).createNoteInput("Ch 12", "?B????");
    Virus12.setShouldConsumeEvents(false);
    Virus13 = host.getMidiInPort(0).createNoteInput("Ch 13", "?C????");
    Virus13.setShouldConsumeEvents(false);
    Virus14 = host.getMidiInPort(0).createNoteInput("Ch 14", "?D????");
    Virus14.setShouldConsumeEvents(false);
    Virus15 = host.getMidiInPort(0).createNoteInput("Ch 15", "?E????");
    Virus15.setShouldConsumeEvents(false);
    Virus16 = host.getMidiInPort(0).createNoteInput("Ch 16", "?F????");
    Virus16.setShouldConsumeEvents(false);

    // Make (7-bit) CC messages for all 16 MIDI channels freely mappable
    userControls = host.createUserControls((HIGHEST_CC - LOWEST_CC + 1)*16);
    for(var i = LOWEST_CC; i <= HIGHEST_CC; i++) {
        for (var j = 1; j <= 16; j++) {
            // Create the index variable c
            var c = i - LOWEST_CC + (j-1) * CC_RANGE;
            // Set a label/name for each userControl
            userControls.getControl(c).setLabel("CC " + i + " (7bit) MIDI Ch. " + j);
        }
    }
}

function onMidi(status, data1, data2)
{
    if (isChannelController(status))
    {
        // Handle 7-bit CCs
        if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
            var index = data1 - LOWEST_CC + (CC_RANGE * MIDIChannel(status));
            userControls.getControl(index).set(data2, RESOLUTION_7_BIT);
        }
    } 
}

function onSysex(data) {
    if (LOG_SYSEX) printSysex(data);
}

function exit()
{
}
