loadAPI(1);

host.defineController("TomsScripts", "Defaulter", "1.0", "002c5ce0-dd01-11e3-8b68-0800200c9a66", "Thomas Helzle");
//host.defineMidiPorts(1, 1);
//host.addDeviceNameBasedDiscoveryPair(["Scarlett 18i20 USB"], ["Scarlett 18i20 USB"]);

// Views etc.
var application = null;
var arranger = null;
var bTrack = null;
var bScene = null;
var cTrack = null;
var cDevice = null;
var ccDevice = null;
var cSlots = null;
var cMix = null;
var cClip = null;
var transport = null;
var prefs = null;
var doc = null;

// Default Settings:
var enableDefaultsPref = null;
var enableDefaults = true;
var defaultGreetingPref = null;
var isInit = true;
var defaultGreeting = "Happy Bitwiggin' ;-)";
var defaultViewPref = null;
var defaultView = "Arrange";

// Default Arranger View:
var defaultClipLauncherPref = null;
var defaultClipLauncher = false;
var defaultTimelinePref = null;
var defaultTimeline = true;
var defaultIOPref = null;
var defaultIO = false;
var defaultEffectsPref = null;
var defaultEffects = true;
var defaultDoubleHeightPref = null;
var defaultDoubleHeight = true;
//var defaultHideHiddenPref = null;
//var defaultHideHidden = false;
var defaultCueMarkersPref = null;
var defaultCueMarkers = false;
var defaultPlaybackFollowPref = null;
var defaultPlaybackFollow = false;

// Default Mixer View:
var defaultMixClipsPref = null;
var defaultMixClips = true;
var defaultMixMetersPref = null;
var defaultMixMeters = false;
var defaultMixDevicePref = null;
var defaultMixDevice = true;
var defaultMixSendsPref = null;
var defaultMixSends = true;
var defaultMixIOPref = null;
var defaultMixIO = true;
var defaultMixABPref = null;
var defaultMixAB = false;
//var defaultBrowserPanelPref = null;
//var defaultBrowserPanel = "Browser";
var defaultInstrumentTracksPref = null;
var defaultInstrumentTracks = 2;
var defaultAudioTracksPref = null;
var defaultAudioTracks = 2;
var defaultEffectTracksPref = null;
var defaultEffectTracks = 2;

// Per Document Settings:
var projectMessageDoc = null;
var projectMessage = "";
var documentViewPref = null;
var documentView = "Arrange";

// Document Arranger View:
var documentClipLauncherPref = null;
var documentClipLauncher = false;
var documentTimelinePref = null;
var documentTimeline = true;
var documentIOPref = null;
var documentIO = false;
var documentEffectsPref = null;
var documentEffects = true;
var documentDoubleHeightPref = null;
var documentDoubleHeight = true;
var documentCueMarkersPref = null;
var documentCueMarkers = false;
var documentPlaybackFollowPref = null;
var documentPlaybackFollow = false;

// Document Mixer View:
var documentMixClipsPref = null;
var documentMixClips = true;
var documentMixMetersPref = null;
var documentMixMeters = false;
var documentMixDevicePref = null;
var documentMixDevice = true;
var documentMixSendsPref = null;
var documentMixSends = true;
var documentMixIOPref = null;
var documentMixIO = true;
var documentMixABPref = null;
var documentMixAB = false;

// Other Variables:
var currentChannelCount = 0;

const YESNO = ["Yes", "No"];
const VIEWS = ["Arrange", "Mix", "Edit"];
const BROWSERVIEWS = ["Browser", "Project", "IO Panel"];


function init() {
   isInit = true;
   //Setting up the main views:
   application = host.createApplication();
   arranger = host.createArranger();
   bTrack = host.createTrackBank(8, 8, 8);
   bScene = host.createSceneBank(8);
   cTrack = host.createArrangerCursorTrack(1, 0);
   cDevice = cTrack.getPrimaryDevice();
   ccDevice = host.createCursorDevice();
   cSlots = cTrack.getClipLauncherSlots();
   cMix = host.createMixer("MIX", 0);
   cClip = host.createCursorClip(1, 1);
   transport = host.createTransport();

   prefs = host.getPreferences();
   doc = host.getDocumentState();

   // Observer:
   bTrack.addChannelCountObserver(function(value){
      currentChannelCount = value;
   });

   application.addPanelLayoutObserver(function (name) {
      //println(name);
   }, 50);

   application.addProjectNameObserver(function (name) {
      if(name === "Untitled" && enableDefaults) {
         //setDefaults();
      }
   }, 100);

   // Preferences:
   enableDefaultsPref = prefs.getEnumSetting("Enable New Document Default", "Global", YESNO, "Yes");
   enableDefaultsPref.addValueObserver(function (value) {
      if(value === "Yes"){
         enableDefaults = true;
         setPrefsVisible(true);
         isInit ? isInit = false : setDefaults();
      }
      else{
         setPrefsVisible(false);
         enableDefaults = false;
      }
   });

   defaultGreetingPref = prefs.getStringSetting("Startup Greeting", "Global", 140, "Happy Bitwiggin' :-)");
   defaultGreetingPref.addValueObserver(function(value){
      defaultGreeting = value;
      if(isInit){
         if(defaultGreeting){
            host.showPopupNotification(defaultGreeting);
            isInit = false; //where should this go?
         }
      }
   });

   defaultViewPref = prefs.getEnumSetting("Initial View", "View Defaults", VIEWS,  "Arrange");
   defaultViewPref.addValueObserver(function (value) {
      defaultView = value;
   });

   defaultClipLauncherPref = prefs.getEnumSetting("ClipLauncher Visible", "Arranger View", YESNO, "No");
   defaultClipLauncherPref.addValueObserver(function(value){
      defaultClipLauncher = (value === "Yes");
   });
   defaultTimelinePref = prefs.getEnumSetting("Timeline Visible", "Arranger View", YESNO, "Yes");
   defaultTimelinePref.addValueObserver(function(value){
      defaultTimeline = (value === "Yes");
   });
   defaultIOPref = prefs.getEnumSetting("Channel IO Visible", "Arranger View", YESNO, "No");
   defaultIOPref.addValueObserver(function(value){
      defaultIO = (value === "Yes");
   });
   defaultEffectsPref = prefs.getEnumSetting("Effect Tracks Visible", "Arranger View", YESNO, "Yes");
   defaultEffectsPref.addValueObserver(function(value){
      defaultEffects = (value === "Yes");
   });
   defaultDoubleHeightPref = prefs.getEnumSetting("Tracks Double Height", "Arranger View", YESNO, "Yes");
   defaultDoubleHeightPref.addValueObserver(function(value){
      defaultDoubleHeight = (value === "Yes");
   });
   defaultCueMarkersPref = prefs.getEnumSetting("Cue Markers Visible", "Arranger View", YESNO, "No");
   defaultCueMarkersPref.addValueObserver(function(value){
      defaultCueMarkers = (value === "Yes");
   });
   defaultPlaybackFollowPref = prefs.getEnumSetting("Playback Follow Active", "Arranger View", YESNO, "No");
   defaultPlaybackFollowPref.addValueObserver(function(value){
      defaultPlaybackFollow = (value === "Yes");
   });

   // Mixer View Settings:
   defaultMixClipsPref = prefs.getEnumSetting("Clips Visible", "Mixer View", YESNO, "Yes");
   defaultMixClipsPref.addValueObserver(function(value){
      defaultMixClips = (value === "Yes");
   });
   defaultMixMetersPref = prefs.getEnumSetting("Big Meters Visible", "Mixer View", YESNO, "No");
   defaultMixMetersPref.addValueObserver(function(value){
      defaultMixMeters = (value === "Yes");
   });
   defaultMixDevicePref = prefs.getEnumSetting("Device Chain Visible", "Mixer View", YESNO, "Yes");
   defaultMixDevicePref.addValueObserver(function(value){
      defaultMixDevice = (value === "Yes");
   });
   defaultMixSendsPref = prefs.getEnumSetting("Sends Visible", "Mixer View", YESNO, "Yes");
   defaultMixSendsPref.addValueObserver(function(value){
      defaultMixSends = (value === "Yes");
   });
   defaultMixIOPref = prefs.getEnumSetting("IO Section Visible", "Mixer View", YESNO, "Yes");
   defaultMixIOPref.addValueObserver(function(value){
      defaultMixIO = (value === "Yes");
   });
   defaultMixABPref = prefs.getEnumSetting("A/B Faders Visible", "Mixer View", YESNO, "No");
   defaultMixABPref.addValueObserver(function(value){
      defaultMixAB = (value === "Yes");
   });
   //defaultBrowserPanelPref = prefs.getEnumSetting("Default Browser Panel", "View Defaults", BROWSERVIEWS, "Browser");
   //defaultBrowserPanelPref.addValueObserver(function(value){
   //   defaultBrowserPanel = value;
   //});

   defaultInstrumentTracksPref = prefs.getNumberSetting("Instrument Tracks", "Tracks", 1, 25, 1, "Tracks", 2);
   defaultInstrumentTracksPref.addValueObserver(1, function(value){
      defaultInstrumentTracks = value;
   });
   defaultAudioTracksPref = prefs.getNumberSetting("Audio Tracks", "Tracks", 1, 25, 1, "Tracks", 2);
   defaultAudioTracksPref.addValueObserver(1, function(value){
      defaultAudioTracks = value;
   });
   defaultEffectTracksPref = prefs.getNumberSetting("Effect Tracks", "Tracks", 1, 25, 1, "Tracks", 2);
   defaultEffectTracksPref.addValueObserver(1, function(value){
      defaultEffectTracks = value;
   });

   // Document Settings:
   projectMessageDoc = doc.getStringSetting("Startup Message", "Global", 500, "");
   projectMessageDoc.addValueObserver(function(value){
      projectMessage = value;
      if(projectMessage){
         host.showPopupNotification(projectMessage);
      }
   });
   documentViewPref = doc.getEnumSetting("Initial View", "View documents", VIEWS,  "Arrange");
   documentViewPref.addValueObserver(function (value) {
      documentView = value;
      switch(documentView) {
         case "Arrange":
            application.setPanelLayout("ARRANGE");
            break;
         case "Mix":
            application.setPanelLayout("MIX");
            break;
         case "Edit":
            application.setPanelLayout("EDIT");
            break;
      }
   });

   documentClipLauncherPref = doc.getEnumSetting("ClipLauncher Visible", "Arranger View", YESNO, "No");
   documentClipLauncherPref.addValueObserver(function(value){
      documentClipLauncher = (value === "Yes");
      arranger.isClipLauncherVisible().set(documentClipLauncher);
   });
   arranger.isClipLauncherVisible().addValueObserver(function(value){
      if(documentClipLauncher != value){
         documentClipLauncherPref.set(value ? "Yes" : "No");
      }
   });
   documentTimelinePref = doc.getEnumSetting("Timeline Visible", "Arranger View", YESNO, "Yes");
   documentTimelinePref.addValueObserver(function(value){
      documentTimeline = (value === "Yes");
      arranger.isTimelineVisible().set(documentTimeline);
   });
   arranger.isTimelineVisible().addValueObserver(function(value){
      if(documentTimeline != value) {
         documentTimelinePref.set(value ? "Yes" : "No");
      }
   });
   documentIOPref = doc.getEnumSetting("Channel IO Visible", "Arranger View", YESNO, "No");
   documentIOPref.addValueObserver(function(value){
      documentIO = (value === "Yes");
      arranger.isIoSectionVisible().set(documentIO);
   });
   arranger.isIoSectionVisible().addValueObserver(function(value){
      if(documentIO != value){
         documentIOPref.set(value ? "Yes" : "No");
      }
   });
   documentEffectsPref = doc.getEnumSetting("Effect Tracks Visible", "Arranger View", YESNO, "Yes");
   documentEffectsPref.addValueObserver(function(value){
      documentEffects = (value === "Yes");
      arranger.areEffectTracksVisible().set(documentEffects);
   });
   arranger.areEffectTracksVisible().addValueObserver(function(value){
      if(documentEffects != value){
         documentEffectsPref.set(value ? "Yes" : "No");
      }
   });
   documentDoubleHeightPref = doc.getEnumSetting("Tracks Double Height", "Arranger View", YESNO, "Yes");
   documentDoubleHeightPref.addValueObserver(function(value){
      documentDoubleHeight = (value === "Yes");
      arranger.hasDoubleRowTrackHeight().set(documentDoubleHeight);
   });
   arranger.hasDoubleRowTrackHeight().addValueObserver(function(value){
      if (documentDoubleHeight != value) {
         documentDoubleHeightPref.set(value ? "Yes" : "No");
      }
   });
   documentCueMarkersPref = doc.getEnumSetting("Cue Markers Visible", "Arranger View", YESNO, "No");
   documentCueMarkersPref.addValueObserver(function(value){
      documentCueMarkers = (value === "Yes");
      arranger.areCueMarkersVisible().set(documentCueMarkers);
   });
   arranger.areCueMarkersVisible().addValueObserver(function(value){
      if(documentCueMarkers != value){
         documentCueMarkersPref.set(value ? "Yes" : "No");
      }
   });
   documentPlaybackFollowPref = doc.getEnumSetting("Playback Follow Active", "Arranger View", YESNO, "No");
   documentPlaybackFollowPref.addValueObserver(function(value){
      documentPlaybackFollow = (value === "Yes");
      arranger.isPlaybackFollowEnabled().set(documentPlaybackFollow);
   });
   arranger.isPlaybackFollowEnabled().addValueObserver(function(value){
      if(documentPlaybackFollow != value){
         documentPlaybackFollowPref.set(value ? "Yes" : "No");
      }
   });

   // Mixer View Settings:
   documentMixClipsPref = doc.getEnumSetting("Clips Visible", "Mixer View", YESNO, "Yes");
   documentMixClipsPref.addValueObserver(function(value){
      documentMixClips = (value === "Yes");
      cMix.isClipLauncherSectionVisible().set(documentMixClips);
   });
   documentMixMetersPref = doc.getEnumSetting("Big Meters Visible", "Mixer View", YESNO, "No");
   documentMixMetersPref.addValueObserver(function(value){
      documentMixMeters = (value === "Yes");
      cMix.isMeterSectionVisible().set(documentMixMeters);
   });
   documentMixDevicePref = doc.getEnumSetting("Device Chain Visible", "Mixer View", YESNO, "Yes");
   documentMixDevicePref.addValueObserver(function(value){
      documentMixDevice = (value === "Yes");
      cMix.isDeviceSectionVisible().set(documentMixDevice);
   });
   documentMixSendsPref = doc.getEnumSetting("Sends Visible", "Mixer View", YESNO, "Yes");
   documentMixSendsPref.addValueObserver(function(value){
      documentMixSends = (value === "Yes");
      cMix.isSendSectionVisible().set(documentMixSends);
   });
   documentMixIOPref = doc.getEnumSetting("IO Section Visible", "Mixer View", YESNO, "Yes");
   documentMixIOPref.addValueObserver(function(value){
      documentMixIO = (value === "Yes");
      cMix.isIoSectionVisible().set(documentIO);
   });
   documentMixABPref = doc.getEnumSetting("A/B Faders Visible", "Mixer View", YESNO, "No");
   documentMixABPref.addValueObserver(function(value){
      documentMixAB = (value === "Yes");
      cMix.isCrossFadeSectionVisible().set(documentMixAB);
   });

   actions = application.getActions();
   //for (var a = 0; a < actions.length; a++) {
   //   println(a + actions[a].getName());
   //}

   //host.scheduleTask(abFader, null, 100);

   //host.scheduleTask(setup, null, 1000);


}

function setPrefsVisible (on){
   // View:
   on ? defaultGreetingPref.enable() : defaultGreetingPref.disable();
   on ? defaultViewPref.enable() : defaultViewPref.disable();
   // Arranger:
   on ? defaultClipLauncherPref.enable() : defaultClipLauncherPref.disable();
   on ? defaultTimelinePref.enable() : defaultTimelinePref.disable();
   on ? defaultIOPref.enable() : defaultIOPref.disable();
   on ? defaultEffectsPref.enable() : defaultEffectsPref.disable();
   on ? defaultDoubleHeightPref.enable() : defaultDoubleHeightPref.disable();
   on ? defaultCueMarkersPref.enable() : defaultCueMarkersPref.disable();
   on ? defaultPlaybackFollowPref.enable() : defaultPlaybackFollowPref.disable();
   // Mixer:
   on ? defaultMixClipsPref.enable() : defaultMixClipsPref.disable();
   on ? defaultMixMetersPref.enable() : defaultMixMetersPref.disable();
   on ? defaultMixDevicePref.enable() : defaultMixDevicePref.disable();
   on ? defaultMixSendsPref.enable() : defaultMixSendsPref.disable();
   on ? defaultMixIOPref.enable() : defaultMixIOPref.disable();
   on ? defaultMixABPref.enable() : defaultMixABPref.disable();

   // Tracks:
   on ? defaultInstrumentTracksPref.enable() : defaultInstrumentTracksPref.disable();
   on ? defaultAudioTracksPref.enable() : defaultAudioTracksPref.disable();
   on ? defaultEffectTracksPref.enable() : defaultEffectTracksPref.disable();
}

function setDefaults() {
   // Set View:
   switch(defaultView) {
      case "Arrange":
         application.setPanelLayout("ARRANGE");
         break;
      case "Mix":
         application.setPanelLayout("MIX");
         break;
      case "Edit":
         application.setPanelLayout("EDIT");
         break;
   }
   // Set Arranger View Settings:
   arranger.isClipLauncherVisible().set(defaultClipLauncher);
   arranger.isTimelineVisible().set(defaultTimeline);
   arranger.isIoSectionVisible().set(defaultIO);
   arranger.areEffectTracksVisible().set(defaultEffects);
   arranger.hasDoubleRowTrackHeight().set(defaultDoubleHeight);
   arranger.areCueMarkersVisible().set(defaultCueMarkers);
   arranger.isPlaybackFollowEnabled().set(defaultPlaybackFollow);

   //Set Mixer View Settings:
   cMix.isClipLauncherSectionVisible().set(defaultMixClips);
   cMix.isMeterSectionVisible().set(defaultMixMeters);
   cMix.isDeviceSectionVisible().set(defaultMixDevice);
   cMix.isSendSectionVisible().set(defaultMixSends);
   cMix.isIoSectionVisible().set(defaultIO);
   cMix.isCrossFadeSectionVisible().set(defaultMixAB);

   // Create Tracks:
   if(currentChannelCount === 4){
      for(var i = 1; i < defaultInstrumentTracks; i++) {
         application.createInstrumentTrack(0);
      }
      for(var i = 1; i < defaultAudioTracks; i++) {
         application.createAudioTrack(-1);
      }
      for(var i = 1; i < defaultEffectTracks; i++) {
         application.createEffectTrack(-1);
      }
   }
   //switch (defaultBrowserPanel) {
   //   case "Browser":
   //      break;
   //   case "Project":
   //      actions[184].invoke();
   //      //actions.getAction("184").invoke();
   //
   //      break;
   //   case "IO Panel":
   //      actions[183].invoke();
   //      //actions.getAction("183").invoke();
   //      break;
   //}

}

function setDocument() {
   arranger.areCueMarkersVisible().set(true);
   arranger.isTimelineVisible().set(true);
   arranger.isIoSectionVisible().set(true);
   arranger.areEffectTracksVisible().set(true);
   cMix.isCrossFadeSectionVisible().set(true);
   //actions[144].invoke();
   //actions[194].invoke();
}

function onMidi(status, data1, data2) {
   printMidi(status, data1, data2);
}

function onSysex(data) {
	printSysex(data);
}

function exit()
{
}
