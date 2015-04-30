// Modified version of "Generic MIDI Keyboard.control.js" by Bitwig
// by Ch00rD
// Cf. <http://www.kvraudio.com/forum/viewtopic.php?f=259&t=437254>
// 
// NB: only supports monophonic use; (the velocity values of) all notes 
// share a single control source. 
// NB: only suitable for live input in current state - playback of notes
// is not (yet) supported. 
// NB: Bitwig's automatic data 'thinning' feature seems to mess things up 
// pretty badly: recorded notes and automation mapped from corresponding 
// notes often end up completely out of sync as a result - so this may well 
// remain (too) problematic (to be actually useful). YMMV. 

loadAPI(1);

host.defineController("Generic", "MIDI Keyboard with rescaled velocity as control source", "0.1", "9725ddc0-ed08-11e4-b80c-0800200c9a66");
host.defineMidiPorts(1, 0);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

function init()
{
    host.getMidiInPort(0).setMidiCallback(onMidi);
    generic = host.getMidiInPort(0).createNoteInput("", "??????");
    generic.setShouldConsumeEvents(false);

    // Make CCs 1-119 freely mappable, add one for (note-on) velocity-based control source
    userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1 + 1);

    for (var i=LOWEST_CC; i<=HIGHEST_CC; i++)
    {
        userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
    }
    userControls.getControl(i - LOWEST_CC).setLabel("Note-On Velocity (Rescaled)");
}

function onMidi(status, data1, data2)
{
    // CCs
    if (isChannelController(status))
    {
        if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
        {
            var index = data1 - LOWEST_CC;
            userControls.getControl(index).set(data2, 128);
        }
    }
    // Notes
    if (isNoteOn(status))
    {
        var index = HIGHEST_CC; // use index number right behind all CCs
        
        // Rescale velocity using exponential function
        var exponent = 1.5; // TWEAK THIS VALUE for different curves; 1.0 = linear, > 1 for exponential curves
        velocity = Math.pow((data2 / 127), exponent); // rescaling to 0-1 range to enable simple exponential function
        // (safety checks:) restrict velocity value to valid range
        if (velocity <= 0) {
	        // Arguably, the minimum should be a positive value rather than 0... but smaller than 1/127?
            velocity = 0.001;
        } else if (velocity > 1) {
            velocity = 1;
        }
        println("note-on velocity: " + data2 + " | exponent: " + exponent + " --> rescaled (0-1): " + velocity + " | (0-127): " + (velocity * 127));   
        userControls.getControl(index).set(velocity, 1);
    }
}

function exit()
{
}
