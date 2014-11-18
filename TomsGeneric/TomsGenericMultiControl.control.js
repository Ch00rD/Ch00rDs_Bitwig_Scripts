//Enhanced Generic Controller Script with Support for
//- all 16 Midi Channels + Omni
//- Poly Aftertouch to Expression
//- CCs fully mappable per Midi Channel...
//- Sending Midi Beat Clock.

loadAPI(1);

host.defineController("TomsScripts", "TomsMultiController", "1.0", "e5559d80-bf02-11e3-b1b6-0800200c9a66", "Thomas Helzle");
host.defineMidiPorts(1, 1);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init()
{
	MultiCon   = host.getMidiInPort(0).createNoteInput("Omni", "??????");
   MultiCon1  = host.getMidiInPort(0).createNoteInput("Ch 1", "?0????");
   MultiCon2  = host.getMidiInPort(0).createNoteInput("Ch 2", "?1????");
   MultiCon3  = host.getMidiInPort(0).createNoteInput("Ch 3", "?2????");
   MultiCon4  = host.getMidiInPort(0).createNoteInput("Ch 4", "?3????");
   MultiCon5  = host.getMidiInPort(0).createNoteInput("Ch 5", "?4????");
   MultiCon6  = host.getMidiInPort(0).createNoteInput("Ch 6", "?5????");
   MultiCon7  = host.getMidiInPort(0).createNoteInput("Ch 7", "?6????");
   MultiCon8  = host.getMidiInPort(0).createNoteInput("Ch 8", "?7????");
   MultiCon9  = host.getMidiInPort(0).createNoteInput("Ch 9", "?8????");
   MultiCon10 = host.getMidiInPort(0).createNoteInput("Ch 10", "?9????");
   MultiCon11 = host.getMidiInPort(0).createNoteInput("Ch 11", "?A????");
   MultiCon12 = host.getMidiInPort(0).createNoteInput("Ch 12", "?B????");
   MultiCon13 = host.getMidiInPort(0).createNoteInput("Ch 13", "?C????");
   MultiCon14 = host.getMidiInPort(0).createNoteInput("Ch 14", "?D????");
   MultiCon15 = host.getMidiInPort(0).createNoteInput("Ch 15", "?E????");
   MultiCon16 = host.getMidiInPort(0).createNoteInput("Ch 16", "?F????");

	MultiCon.setShouldConsumeEvents(false);
	MultiCon1.setShouldConsumeEvents(false);
	MultiCon2.setShouldConsumeEvents(false);
   MultiCon3.setShouldConsumeEvents(false);
   MultiCon4.setShouldConsumeEvents(false);
   MultiCon5.setShouldConsumeEvents(false);
   MultiCon6.setShouldConsumeEvents(false);
   MultiCon7.setShouldConsumeEvents(false);
   MultiCon8.setShouldConsumeEvents(false);
   MultiCon9.setShouldConsumeEvents(false);
   MultiCon10.setShouldConsumeEvents(false);
   MultiCon11.setShouldConsumeEvents(false);
   MultiCon12.setShouldConsumeEvents(false);
   MultiCon13.setShouldConsumeEvents(false);
   MultiCon14.setShouldConsumeEvents(false);
   MultiCon15.setShouldConsumeEvents(false);
   MultiCon16.setShouldConsumeEvents(false);

	MultiCon.assignPolyphonicAftertouchToExpression(0,   NoteExpression.TIMBRE_UP, 5);
	MultiCon1.assignPolyphonicAftertouchToExpression(0,   NoteExpression.TIMBRE_UP, 5);
	MultiCon2.assignPolyphonicAftertouchToExpression(1,   NoteExpression.TIMBRE_UP, 5);
   MultiCon3.assignPolyphonicAftertouchToExpression(2,   NoteExpression.TIMBRE_UP, 5);
   MultiCon4.assignPolyphonicAftertouchToExpression(3,   NoteExpression.TIMBRE_UP, 5);
   MultiCon5.assignPolyphonicAftertouchToExpression(4,   NoteExpression.TIMBRE_UP, 5);
   MultiCon6.assignPolyphonicAftertouchToExpression(5,   NoteExpression.TIMBRE_UP, 5);
   MultiCon7.assignPolyphonicAftertouchToExpression(6,   NoteExpression.TIMBRE_UP, 5);
   MultiCon8.assignPolyphonicAftertouchToExpression(7,   NoteExpression.TIMBRE_UP, 5);
   MultiCon9.assignPolyphonicAftertouchToExpression(8,   NoteExpression.TIMBRE_UP, 5);
   MultiCon10.assignPolyphonicAftertouchToExpression(9,  NoteExpression.TIMBRE_UP, 5);
   MultiCon11.assignPolyphonicAftertouchToExpression(10, NoteExpression.TIMBRE_UP, 5);
   MultiCon12.assignPolyphonicAftertouchToExpression(11, NoteExpression.TIMBRE_UP, 5);
   MultiCon13.assignPolyphonicAftertouchToExpression(12, NoteExpression.TIMBRE_UP, 5);
   MultiCon14.assignPolyphonicAftertouchToExpression(13, NoteExpression.TIMBRE_UP, 5);
   MultiCon15.assignPolyphonicAftertouchToExpression(14, NoteExpression.TIMBRE_UP, 5);
   MultiCon16.assignPolyphonicAftertouchToExpression(15, NoteExpression.TIMBRE_UP, 5);

	host.getMidiOutPort(0).setShouldSendMidiBeatClock;
   host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);

   // Make CCs 2-119 freely mappable for all 16 Channels
   userControls = host.createUserControlsSection((HIGHEST_CC - LOWEST_CC + 1)*16);


   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++)
   {
      for (var j=1; j<=16; j++) {
         // Create the index variable c
         var c = i - LOWEST_CC + (j-1) * (HIGHEST_CC-LOWEST_CC+1);
         // Set a label/name for each userControl
         userControls.getControl(c).setLabel("CC " + i + " - Channel " + j);
      }
   }
}

function onMidi(status, data1, data2) {
	 //printMidi(status, data1, data2);
	 //println(MIDIChannel(status));

   if (isChannelController(status)) {
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
         var index = data1 - LOWEST_CC + (HIGHEST_CC * MIDIChannel(status));
         userControls.getControl(index).set(data2, 128);
      }
   }
}

function onSysex(data) {
	//printSysex(data);
}

function exit() {
   // nothing to do here ;-)
}
