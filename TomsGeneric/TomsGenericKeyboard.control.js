//Enhanced Generic Controller Script with Support for
//- all 16 Midi Channels + Omni
//- Poly Aftertouch to Expression
//- CCs fully mappable...
//- Sending Midi Beat Clock.

loadAPI(1);

host.defineController("TomsScripts", "TomsGenericKeys", "1.0", "b79ced50-bb8b-11e3-a5e2-0800200c9a66", "Thomas Helzle");
host.defineMidiPorts(1, 1);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init() {
	TomsGeneric   = host.getMidiInPort(0).createNoteInput("Omni", "??????");
   TomsGeneric1  = host.getMidiInPort(0).createNoteInput("Ch 1", "?0????");
   TomsGeneric2  = host.getMidiInPort(0).createNoteInput("Ch 2", "?1????");
   TomsGeneric3  = host.getMidiInPort(0).createNoteInput("Ch 3", "?2????");
   TomsGeneric4  = host.getMidiInPort(0).createNoteInput("Ch 4", "?3????");
   TomsGeneric5  = host.getMidiInPort(0).createNoteInput("Ch 5", "?4????");
   TomsGeneric6  = host.getMidiInPort(0).createNoteInput("Ch 6", "?5????");
   TomsGeneric7  = host.getMidiInPort(0).createNoteInput("Ch 7", "?6????");
   TomsGeneric8  = host.getMidiInPort(0).createNoteInput("Ch 8", "?7????");
   TomsGeneric9  = host.getMidiInPort(0).createNoteInput("Ch 9", "?8????");
   TomsGeneric10 = host.getMidiInPort(0).createNoteInput("Ch 10", "?9????");
   TomsGeneric11 = host.getMidiInPort(0).createNoteInput("Ch 11", "?A????");
   TomsGeneric12 = host.getMidiInPort(0).createNoteInput("Ch 12", "?B????");
   TomsGeneric13 = host.getMidiInPort(0).createNoteInput("Ch 13", "?C????");
   TomsGeneric14 = host.getMidiInPort(0).createNoteInput("Ch 14", "?D????");
   TomsGeneric15 = host.getMidiInPort(0).createNoteInput("Ch 15", "?E????");
   TomsGeneric16 = host.getMidiInPort(0).createNoteInput("Ch 16", "?F????");

	TomsGeneric.setShouldConsumeEvents(false);
	TomsGeneric1.setShouldConsumeEvents(false);
	TomsGeneric2.setShouldConsumeEvents(false);
   TomsGeneric3.setShouldConsumeEvents(false);
   TomsGeneric4.setShouldConsumeEvents(false);
   TomsGeneric5.setShouldConsumeEvents(false);
   TomsGeneric6.setShouldConsumeEvents(false);
   TomsGeneric7.setShouldConsumeEvents(false);
   TomsGeneric8.setShouldConsumeEvents(false);
   TomsGeneric9.setShouldConsumeEvents(false);
   TomsGeneric10.setShouldConsumeEvents(false);
   TomsGeneric11.setShouldConsumeEvents(false);
   TomsGeneric12.setShouldConsumeEvents(false);
   TomsGeneric13.setShouldConsumeEvents(false);
   TomsGeneric14.setShouldConsumeEvents(false);
   TomsGeneric15.setShouldConsumeEvents(false);
   TomsGeneric16.setShouldConsumeEvents(false);

	TomsGeneric.assignPolyphonicAftertouchToExpression(0,   NoteExpression.TIMBRE_UP, 5);
	TomsGeneric1.assignPolyphonicAftertouchToExpression(0,   NoteExpression.TIMBRE_UP, 5);
	TomsGeneric2.assignPolyphonicAftertouchToExpression(1,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric3.assignPolyphonicAftertouchToExpression(2,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric4.assignPolyphonicAftertouchToExpression(3,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric5.assignPolyphonicAftertouchToExpression(4,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric6.assignPolyphonicAftertouchToExpression(5,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric7.assignPolyphonicAftertouchToExpression(6,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric8.assignPolyphonicAftertouchToExpression(7,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric9.assignPolyphonicAftertouchToExpression(8,   NoteExpression.TIMBRE_UP, 5);
   TomsGeneric10.assignPolyphonicAftertouchToExpression(9,  NoteExpression.TIMBRE_UP, 5);
   TomsGeneric11.assignPolyphonicAftertouchToExpression(10, NoteExpression.TIMBRE_UP, 5);
   TomsGeneric12.assignPolyphonicAftertouchToExpression(11, NoteExpression.TIMBRE_UP, 5);
   TomsGeneric13.assignPolyphonicAftertouchToExpression(12, NoteExpression.TIMBRE_UP, 5);
   TomsGeneric14.assignPolyphonicAftertouchToExpression(13, NoteExpression.TIMBRE_UP, 5);
   TomsGeneric15.assignPolyphonicAftertouchToExpression(14, NoteExpression.TIMBRE_UP, 5);
   TomsGeneric16.assignPolyphonicAftertouchToExpression(15, NoteExpression.TIMBRE_UP, 5);

	host.getMidiOutPort(0).setShouldSendMidiBeatClock;
   host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);

   // Make CCs 2-119 freely mappable
   userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1);

   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++) {
      userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
   }
}

function onMidi(status, data1, data2) {
	 //printMidi(status, data1, data2);

   if (isChannelController(status)) {
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
         var index = data1 - LOWEST_CC;
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
