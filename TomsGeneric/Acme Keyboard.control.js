//Basic generic Controller Script. Result of my Intro-Tutorial here:
//http://blog.thomashelzle.de/2014/04/bitwig-studio-tutorial-1how-to-create-named-controllers/

loadAPI(1);

host.defineController("Acme", "Acme Keyboard", "1.0", "d84e03d0-b605-11e3-a5e2-0800200c9a66");
host.defineMidiPorts(1, 0);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init() {
   Acme = host.getMidiInPort(0).createNoteInput("Acme Keyboard");
	Acme.setShouldConsumeEvents(false);

   host.getMidiInPort(0).setMidiCallback(onMidi);

   // Make CCs 2-119 freely mappable
   userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1);

   for(var i=LOWEST_CC; i<=HIGHEST_CC; i++) {
      userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
   }
}

function onMidi(status, data1, data2) {
   if (isChannelController(status)) {
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
         var index = data1 - LOWEST_CC;
         userControls.getControl(index).set(data2, 128);
      }
   }
}

function exit() {
   // nothing to do here... ;-)
}
