//A simple Controller Script for the Doepfer LMK3 Keyboard.
//- All CCs mappable

loadAPI(1);

host.defineController("Doepfer", "LMK3", "1.0", "995C2A90-3427-11E3-AA6E-0800200C9A66");
host.defineMidiPorts(1, 1);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init()
{
   Doepfer = host.getMidiInPort(0).createNoteInput("Doepfer LMK3", "?0????");
	 Doepfer.setShouldConsumeEvents(false);

	 host.getMidiInPort(0).setMidiCallback(onMidi);
	 
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
   if (isChannelController(status))
   {
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
      {
         var index = data1 - LOWEST_CC;
         userControls.getControl(index).set(data2, 128);
      }
   }
}