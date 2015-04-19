// ------------------------------
// Editable configurations
// ------------------------------

Config.SETTINGS_INDEX_TRACKS_TOTAL = 0;

// Total number of tracks (excluding master track and effect tracks) being observed; 
// perhaps best to use a relatively large number, at least as large as the 
// total number of tracks in (all) your projects
Config.tracksTotal = 24;

Config.init = function ()
{
    var prefs = host.getPreferences ();

    Config.tracksTotalSetting = prefs.getNumberSetting ('Tracks', '(Maximum) number of supported tracks', 0, Config.tracksTotal, 1, '', Config.tracksTotal);
    Config.tracksTotalSetting.addRawValueObserver (function (value)
    {
        Config.tracksTotal = Math.floor (value);
        Config.notifyListeners (Config.SETTINGS_INDEX_TRACKS_TOTAL);
    });
};    


// ------------------------------
// Property listeners
// ------------------------------

Config.listeners = [];
for (var i = 0; i <= Config.SETTINGS_INDEX_TRACKS_TOTAL; i++)
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
