// generic Midi Keyboard Script with IN and OUT
// Modified from the original by Thomas Helzle

loadAPI(1);

host.defineController("TomsScripts", "MIDI Keyboard InOut", "1.0", "f60c7450-b5bb-11e3-a5e2-0800200c9a66");
host.defineMidiPorts(1, 1);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init()
{
   Generic =host.getMidiInPort(0).createNoteInput("MIDI Keyboard InOut", "??????");
	Generic.setShouldConsumeEvents(false);
	Generic.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 12);

 	host.getMidiOutPort(0).setShouldSendMidiBeatClock;
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
