// ------------------------------
// Editable configurations
// ------------------------------

Config.SETTINGS_INDEX_TRACKS_MAXIMUM = 0;

// Total number of tracks (excluding master track and effect tracks) being observed; 
// perhaps best to use a relatively large number, at least as large as the 
// total number of tracks in (all) your projects
Config.tracksMax = 100;

Config.init = function ()
{
    var prefs = host.getPreferences ();

    Config.tracksMaxSetting = prefs.getNumberSetting ('Tracks', '(Maximum) number of supported tracks', 0, Config.tracksMax, 1, '', Config.tracksMax);
    Config.tracksMaxSetting.addRawValueObserver (function (value)
    {
        Config.tracksMax = Math.floor (value);
        Config.notifyListeners (Config.SETTINGS_INDEX_TRACKS_MAXIMUM);
    });
};    


// ------------------------------
// Property listeners
// ------------------------------

Config.listeners = [];
for (var i = 0; i <= Config.SETTINGS_INDEX_TRACKS_MAXIMUM; i++)
    Config.listeners[i] = [];

Config.addPropertyListener = function (property, listener)
{
    Config.listeners[property].push (listener);
};

Config.notifyListeners = function (property)
{
    var ls = Config.listeners[property];
    for (var i = 0; i < ls.length; i++)
        ls[i].call (null);
};

function Config () {}
