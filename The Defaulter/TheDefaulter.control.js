// "The Defaulter" is a script to set project defaults on startup and when creating new projects.
// Second, the settings are mirrored in the IO panel and saved with the document, so it's last state is restored on reload.
//
// Thomas Helzle - 2014

loadAPI(1);

host.defineController("TomsScripts", "The Defaulter", "1.0", "002c5ce0-dd01-11e3-8b68-0800200c9a66", "Thomas Helzle");
//host.defineMidiPorts(1, 1);
//host.addDeviceNameBasedDiscoveryPair(["Scarlett 18i20 USB"], ["Scarlett 18i20 USB"]);

// Constants:
const YESNO = ["Yes", "No"];
const VIEWS = ["ARRANGE", "MIX", "EDIT"];

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
var defaultView = VIEWS[0];

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
var defaultInstrumentTracksPref = null;
var defaultInstrumentTracks = 2;
var defaultAudioTracksPref = null;
var defaultAudioTracks = 2;
var defaultEffectTracksPref = null;
var defaultEffectTracks = 2;

// Per Document Settings:
var documentMessagePref = null;
var documentMessage = "";
var documentViewPref = null;
var documentView = VIEWS[0];
var currentView = VIEWS[0];

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
var currentChannelCount = 5000;
var projectName = "";


function init() {
   isInit = true;
   //Setting up the main views:
   application = host.createApplication();
   arranger = host.createArranger();
   bTrack = host.createTrackBank(8, 8, 8);
   cMix = host.createMixer("MIX", 0);
   transport = host.createTransport();

   // The object for the Controller Preferences:
   prefs = host.getPreferences();
   // And for the Document Preferences:
   doc = host.getDocumentState();

   // General Observers:
   bTrack.addChannelCountObserver(function (value) {
      currentChannelCount = value;
   });

   // Creating all the Preferences:
   // Global:
   enableDefaultsPref = prefs.getEnumSetting("Enable New Document Default", "Global", YESNO, "Yes");
   enableDefaultsPref.addValueObserver(function (value) {
      if (value === "Yes") {
         enableDefaults = true;
         setPrefsVisible(true);
      }
      else {
         enableDefaults = false;
         setPrefsVisible(false);
      }
   });

   defaultGreetingPref = prefs.getStringSetting("Startup Greeting (empty for none)", "Global", 140, "Happy Bitwiggin' :-)");
   defaultGreetingPref.addValueObserver(function (value) {
      defaultGreeting = value;
      if (isInit) {
         isInit = false;
         if (defaultGreeting) {
            host.showPopupNotification(defaultGreeting);
         }
      }
   });

   //defaultViewPref = prefs.getEnumSetting("Initial View", "View Defaults", VIEWS, VIEWS[0]);
   //defaultViewPref.addValueObserver(function (value) {
   //   defaultView = value;
   //});

   // Arranger Settings:
   defaultClipLauncherPref = prefs.getEnumSetting("ClipLauncher Visible", "Arranger View", YESNO, "No");
   defaultClipLauncherPref.addValueObserver(function (value) {
      defaultClipLauncher = (value === "Yes");
   });
   defaultTimelinePref = prefs.getEnumSetting("Timeline Visible", "Arranger View", YESNO, "Yes");
   defaultTimelinePref.addValueObserver(function (value) {
      defaultTimeline = (value === "Yes");
   });
   defaultIOPref = prefs.getEnumSetting("Channel IO Visible", "Arranger View", YESNO, "No");
   defaultIOPref.addValueObserver(function (value) {
      defaultIO = (value === "Yes");
   });
   defaultEffectsPref = prefs.getEnumSetting("Effect Tracks Visible", "Arranger View", YESNO, "Yes");
   defaultEffectsPref.addValueObserver(function (value) {
      defaultEffects = (value === "Yes");
   });
   defaultDoubleHeightPref = prefs.getEnumSetting("Tracks Double Height", "Arranger View", YESNO, "Yes");
   defaultDoubleHeightPref.addValueObserver(function (value) {
      defaultDoubleHeight = (value === "Yes");
   });
   defaultCueMarkersPref = prefs.getEnumSetting("Cue Markers Visible", "Arranger View", YESNO, "No");
   defaultCueMarkersPref.addValueObserver(function (value) {
      defaultCueMarkers = (value === "Yes");
   });
   defaultPlaybackFollowPref = prefs.getEnumSetting("Playback Follow Active", "Arranger View", YESNO, "No");
   defaultPlaybackFollowPref.addValueObserver(function (value) {
      defaultPlaybackFollow = (value === "Yes");
   });

   // Mixer View Settings:
   defaultMixClipsPref = prefs.getEnumSetting("Clips Visible", "Mixer View", YESNO, "Yes");
   defaultMixClipsPref.addValueObserver(function (value) {
      defaultMixClips = (value === "Yes");
   });
   defaultMixMetersPref = prefs.getEnumSetting("Big Meters Visible", "Mixer View", YESNO, "No");
   defaultMixMetersPref.addValueObserver(function (value) {
      defaultMixMeters = (value === "Yes");
   });
   defaultMixDevicePref = prefs.getEnumSetting("Device Chain Visible", "Mixer View", YESNO, "Yes");
   defaultMixDevicePref.addValueObserver(function (value) {
      defaultMixDevice = (value === "Yes");
   });
   defaultMixSendsPref = prefs.getEnumSetting("Sends Visible", "Mixer View", YESNO, "Yes");
   defaultMixSendsPref.addValueObserver(function (value) {
      defaultMixSends = (value === "Yes");
   });
   defaultMixIOPref = prefs.getEnumSetting("IO Section Visible", "Mixer View", YESNO, "Yes");
   defaultMixIOPref.addValueObserver(function (value) {
      defaultMixIO = (value === "Yes");
   });
   defaultMixABPref = prefs.getEnumSetting("A/B Faders Visible", "Mixer View", YESNO, "No");
   defaultMixABPref.addValueObserver(function (value) {
      defaultMixAB = (value === "Yes");
   });


   defaultInstrumentTracksPref = prefs.getNumberSetting("Instrument Tracks", "Tracks", 1, 25, 1, "Tracks", 2);
   defaultInstrumentTracksPref.addValueObserver(1, function (value) {
      defaultInstrumentTracks = value;
   });
   defaultAudioTracksPref = prefs.getNumberSetting("Audio Tracks", "Tracks", 1, 25, 1, "Tracks", 2);
   defaultAudioTracksPref.addValueObserver(1, function (value) {
      defaultAudioTracks = value;
   });
   defaultEffectTracksPref = prefs.getNumberSetting("Effect Tracks", "Tracks", 1, 25, 1, "Tracks", 2);
   defaultEffectTracksPref.addValueObserver(1, function (value) {
      defaultEffectTracks = value;
   });

   // Document Settings:
   // Global:
   documentMessagePref = doc.getStringSetting("Startup Message", "Global", 500, "");
   documentMessagePref.addValueObserver(function (value) {
      documentMessage = value;
      if (documentMessage) {
         host.showPopupNotification(documentMessage);
      }
   });
   //documentViewPref = doc.getEnumSetting("Initial View", "Layout", VIEWS, VIEWS[0]);
   //documentViewPref.addValueObserver(function (value) {
   //   println(value);
   //   if(documentView != value){
   //      documentView = value;
   //      application.setPanelLayout(value);
   //   }
   //});
   //application.addPanelLayoutObserver(function (view) {
   //   println(view);
   //   if (currentView != view) {
   //      currentView = view;
   //      documentViewPref.set(view);
   //   }
   //}, 50);

   // Arranger Settings:
   documentClipLauncherPref = doc.getEnumSetting("ClipLauncher Visible", "Arranger View", YESNO, "No");
   documentClipLauncherPref.addValueObserver(function (value) {
      documentClipLauncher = (value === "Yes");
      arranger.isClipLauncherVisible().set(documentClipLauncher);
   });
   arranger.isClipLauncherVisible().addValueObserver(function (value) {
      if (documentClipLauncher != value) {
         documentClipLauncherPref.set(value ? "Yes" : "No");
      }
   });
   documentTimelinePref = doc.getEnumSetting("Timeline Visible", "Arranger View", YESNO, "Yes");
   documentTimelinePref.addValueObserver(function (value) {
      documentTimeline = (value === "Yes");
      arranger.isTimelineVisible().set(documentTimeline);
   });
   arranger.isTimelineVisible().addValueObserver(function (value) {
      if (documentTimeline != value) {
         documentTimelinePref.set(value ? "Yes" : "No");
      }
   });
   documentIOPref = doc.getEnumSetting("Channel IO Visible", "Arranger View", YESNO, "No");
   documentIOPref.addValueObserver(function (value) {
      documentIO = (value === "Yes");
      arranger.isIoSectionVisible().set(documentIO);
   });
   arranger.isIoSectionVisible().addValueObserver(function (value) {
      if (documentIO != value) {
         documentIOPref.set(value ? "Yes" : "No");
      }
   });
   documentEffectsPref = doc.getEnumSetting("Effect Tracks Visible", "Arranger View", YESNO, "Yes");
   documentEffectsPref.addValueObserver(function (value) {
      documentEffects = (value === "Yes");
      arranger.areEffectTracksVisible().set(documentEffects);
   });
   arranger.areEffectTracksVisible().addValueObserver(function (value) {
      if (documentEffects != value) {
         documentEffectsPref.set(value ? "Yes" : "No");
      }
   });
   documentDoubleHeightPref = doc.getEnumSetting("Tracks Double Height", "Arranger View", YESNO, "Yes");
   documentDoubleHeightPref.addValueObserver(function (value) {
      documentDoubleHeight = (value === "Yes");
      arranger.hasDoubleRowTrackHeight().set(documentDoubleHeight);
   });
   arranger.hasDoubleRowTrackHeight().addValueObserver(function (value) {
      if (documentDoubleHeight != value) {
         documentDoubleHeightPref.set(value ? "Yes" : "No");
      }
   });
   documentCueMarkersPref = doc.getEnumSetting("Cue Markers Visible", "Arranger View", YESNO, "No");
   documentCueMarkersPref.addValueObserver(function (value) {
      documentCueMarkers = (value === "Yes");
      arranger.areCueMarkersVisible().set(documentCueMarkers);
   });
   arranger.areCueMarkersVisible().addValueObserver(function (value) {
      if (documentCueMarkers != value) {
         documentCueMarkersPref.set(value ? "Yes" : "No");
      }
   });
   documentPlaybackFollowPref = doc.getEnumSetting("Playback Follow Active", "Arranger View", YESNO, "No");
   documentPlaybackFollowPref.addValueObserver(function (value) {
      documentPlaybackFollow = (value === "Yes");
      arranger.isPlaybackFollowEnabled().set(documentPlaybackFollow);
   });
   arranger.isPlaybackFollowEnabled().addValueObserver(function (value) {
      if (documentPlaybackFollow != value) {
         documentPlaybackFollowPref.set(value ? "Yes" : "No");
      }
   });

   // Mixer View Settings:
   documentMixClipsPref = doc.getEnumSetting("Clips Visible", "Mixer View", YESNO, "Yes");
   documentMixClipsPref.addValueObserver(function (value) {
      documentMixClips = (value === "Yes");
      cMix.isClipLauncherSectionVisible().set(documentMixClips);
   });
   cMix.isClipLauncherSectionVisible().addValueObserver(function (value) {
      if (documentMixClips != value) {
         documentMixClipsPref.set(value ? "Yes" : "No");
      }
   });
   documentMixMetersPref = doc.getEnumSetting("Big Meters Visible", "Mixer View", YESNO, "No");
   documentMixMetersPref.addValueObserver(function (value) {
      documentMixMeters = (value === "Yes");
      cMix.isMeterSectionVisible().set(documentMixMeters);
   });
   cMix.isMeterSectionVisible().addValueObserver(function (value) {
      if (documentMixMeters != value) {
         documentMixMetersPref.set(value ? "Yes" : "No");
      }
   });
   documentMixDevicePref = doc.getEnumSetting("Device Chain Visible", "Mixer View", YESNO, "Yes");
   documentMixDevicePref.addValueObserver(function (value) {
      documentMixDevice = (value === "Yes");
      cMix.isDeviceSectionVisible().set(documentMixDevice);
   });
   cMix.isDeviceSectionVisible().addValueObserver(function (value) {
      if (documentMixDevice != value) {
         documentMixDevicePref.set(value ? "Yes" : "No");
      }
   });
   documentMixSendsPref = doc.getEnumSetting("Sends Visible", "Mixer View", YESNO, "Yes");
   documentMixSendsPref.addValueObserver(function (value) {
      documentMixSends = (value === "Yes");
      cMix.isSendSectionVisible().set(documentMixSends);
   });
   cMix.isSendSectionVisible().addValueObserver(function (value) {
      if (documentMixSends != value) {
         documentMixSendsPref.set(value ? "Yes" : "No");
      }
   });
   documentMixIOPref = doc.getEnumSetting("IO Section Visible", "Mixer View", YESNO, "Yes");
   documentMixIOPref.addValueObserver(function (value) {
      documentMixIO = (value === "Yes");
      cMix.isIoSectionVisible().set(documentMixIO);
   });
   cMix.isIoSectionVisible().addValueObserver(function (value) {
      if (documentMixIO != value) {
         documentMixIOPref.set(value ? "Yes" : "No");
      }
   });
   documentMixABPref = doc.getEnumSetting("A/B Faders Visible", "Mixer View", YESNO, "No");
   documentMixABPref.addValueObserver(function (value) {
      documentMixAB = (value === "Yes");
      cMix.isCrossFadeSectionVisible().set(documentMixAB);
   });
   cMix.isCrossFadeSectionVisible().addValueObserver(function (value) {
      if (documentMixAB != value) {
         documentMixABPref.set(value ? "Yes" : "No");
      }
   });

   //actions = application.getActions();
   //for (var a = 0; a < actions.length; a++) {
   //   println(a + actions[a].getName());
   //}

   application.addProjectNameObserver(function (name) {
      projectName = name;
      host.scheduleTask(delayedSetter, null, 500);
   }, 100);

   if(defaultGreeting) {
      host.showPopupNotification(defaultGreeting);
   }

   host.scheduleTask(delayedSetter, null, 500);
}

function delayedSetter() {
   if (projectName === "Untitled" && enableDefaults && currentChannelCount === 4) {
      setDefaults();
   }
}

function setPrefsVisible(on) {
   // View:
   on ? defaultGreetingPref.show() : defaultGreetingPref.hide();
   //on ? defaultViewPref.show() : defaultViewPref.hide();
   // Arranger:
   on ? defaultClipLauncherPref.show() : defaultClipLauncherPref.hide();
   on ? defaultTimelinePref.show() : defaultTimelinePref.hide();
   on ? defaultIOPref.show() : defaultIOPref.hide();
   on ? defaultEffectsPref.show() : defaultEffectsPref.hide();
   on ? defaultDoubleHeightPref.show() : defaultDoubleHeightPref.hide();
   on ? defaultCueMarkersPref.show() : defaultCueMarkersPref.hide();
   on ? defaultPlaybackFollowPref.show() : defaultPlaybackFollowPref.hide();
   // Mixer:
   on ? defaultMixClipsPref.show() : defaultMixClipsPref.hide();
   on ? defaultMixMetersPref.show() : defaultMixMetersPref.hide();
   on ? defaultMixDevicePref.show() : defaultMixDevicePref.hide();
   on ? defaultMixSendsPref.show() : defaultMixSendsPref.hide();
   on ? defaultMixIOPref.show() : defaultMixIOPref.hide();
   on ? defaultMixABPref.show() : defaultMixABPref.hide();

   // Tracks:
   on ? defaultInstrumentTracksPref.show() : defaultInstrumentTracksPref.hide();
   on ? defaultAudioTracksPref.show() : defaultAudioTracksPref.hide();
   on ? defaultEffectTracksPref.show() : defaultEffectTracksPref.hide();
}

//function setDocPrefsVisible(on) {
//   // View:
//   on ? documentMessagePref.show() : documentMessagePref.hide();
//   on ? documentViewPref.show() : documentViewPref.hide();
//   // Arranger:
//   on ? documentClipLauncherPref.show() : documentClipLauncherPref.hide();
//   on ? documentTimelinePref.show() : documentTimelinePref.hide();
//   on ? documentIOPref.show() : documentIOPref.hide();
//   on ? documentEffectsPref.show() : documentEffectsPref.hide();
//   on ? documentDoubleHeightPref.show() : documentDoubleHeightPref.hide();
//   on ? documentCueMarkersPref.show() : documentCueMarkersPref.hide();
//   on ? documentPlaybackFollowPref.show() : documentPlaybackFollowPref.hide();
//   // Mixer:
//   on ? documentMixClipsPref.show() : documentMixClipsPref.hide();
//   on ? documentMixMetersPref.show() : documentMixMetersPref.hide();
//   on ? documentMixDevicePref.show() : documentMixDevicePref.hide();
//   on ? documentMixSendsPref.show() : documentMixSendsPref.hide();
//   on ? documentMixIOPref.show() : documentMixIOPref.hide();
//   on ? documentMixABPref.show() : documentMixABPref.hide();
//}

function setDefaults() {
   // Set View:
   //application.setPanelLayout(defaultView);
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
   cMix.isIoSectionVisible().set(defaultMixIO);
   cMix.isCrossFadeSectionVisible().set(defaultMixAB);

   // Create Tracks:
   if (currentChannelCount === 4) {
      for (var i = 1; i < defaultEffectTracks; i++) {
         application.createEffectTrack(-1);
      }
      for (var i = 1; i < defaultAudioTracks; i++) {
         application.createAudioTrack(-1);
      }
      for (var i = 1; i < defaultInstrumentTracks; i++) {
         application.createInstrumentTrack(0);
      }
   }
}

function exit() {
}
