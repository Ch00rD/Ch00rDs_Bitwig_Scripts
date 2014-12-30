//A simple Controller Script for the Eowave "The Ribbon" Controller.
//- All CCs mappable
//- Autodetection

loadAPI(1);

host.defineController("Eowave", "The Ribbon", "1.0", "eb786b00-8ec0-11e4-b4a9-0800200c9a66", "Thomas Helzle");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["The Ribbon"], ["The Ribbon"]);
host.addDeviceNameBasedDiscoveryPair(["The Ribbon MIDI 1"], ["The Ribbon MIDI 1"]);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init() {
   var eowave = host.getMidiInPort(0).createNoteInput("Ribbon", "??????");
   host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);

   eowave.setShouldConsumeEvents(false);

   // Make CCs freely mappable
   userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1);

   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++) {
      userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
   }
}


function onMidi(status, data1, data2) {
	 //printMidi(status, data1, data2);
	 //println(MIDIChannel(status));

   if (isChannelController(status)) {
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
         var index = data1 - LOWEST_CC;
         userControls.getControl(index).set(data2, 128);
      }
   }
}

function onSysex(data)
{
	printSysex(data);
}

function exit() {
   // Nothing to do here... :-)
}
