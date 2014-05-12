//A simple Controller Script for the AKAI MPD 18 Pad Controller.
//- All CCs mappable
//- Poly Aftertouch to Timbre (Needs to be set up in the Controller to work!)
//- Autodetection

loadAPI(1);

host.defineController("Akai", "MPD18", "1.0", "E5C26D00-40A6-11E3-AA6E-0800200C9A66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Akai MPD18"], ["Akai MPD18"]);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init()
{
   var AKAI = host.getMidiInPort(0).createNoteInput("Akai MPD18", "??????");
   host.getMidiInPort(0).setMidiCallback(onMidi);
	 host.getMidiInPort(0).setSysexCallback(onSysex);

 	 AKAI.setShouldConsumeEvents(false);
	 AKAI.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);

   // Make CCs 2-119 freely mappable
   userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1);

   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++)
   {
      userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
   }	 
}

function exit()
{
}

function onMidi(status, data1, data2)
{
	 //printMidi(status, data1, data2);

   if (isChannelController(status))
   {
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
      {
         var index = data1 - LOWEST_CC;
         userControls.getControl(index).set(data2, 128);
      }
   }
}

function onSysex(data)
{
	printSysex(data);
}