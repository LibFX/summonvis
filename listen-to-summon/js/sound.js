/**
 * Sound manager code derived from Listen to Bitcoins
 */
SoundManager = (function () {

var celesta = [],
    clav = [],
    swells = [];

var allLoaded = new Barrier(function () {
    console.log("All sounds loaded.");
});

var fn;
// load celesta and clav sounds
for (var i = 1; i <= 27; i++) {
    if (i > 9) {
        fn = 'c0' + i;
    } else {
        fn = 'c00' + i;
    }
    celesta.push(new Howl({
        urls : ['sounds/celesta/' + fn + '.ogg',
                'sounds/celesta/' + fn + '.mp3'],
        volume : 0.2,
        onload: allLoaded.addFunc()
    }))
    clav.push(new Howl({
        urls : ['sounds/clav/' + fn + '.ogg',
                'sounds/clav/' + fn + '.mp3'],
        volume : 0.2,
        onload: allLoaded.addFunc()
    }))
}

// load swell sounds
for (var i = 1; i <= 3; i++) {
    swells.push(new Howl({
        urls : ['sounds/swells/swell' + i + '.ogg',
                'sounds/swells/swell' + i + '.mp3'],
        volume : 1,
        onload: allLoaded.addFunc()
    }))
}

function SoundManager(initialVolume) {
    this.global_volume = initialVolume;
    this.note_overlap = 15;     // maximum 15 notes play at the same time
    this.note_timeout = 300;    // a note will be counted for 300ms
    this.current_notes = 0;
    Howler.volume(this.global_volume * .01);
}

SoundManager.prototype.setVolume = function (volume) {
    this.global_volume = volume;
    var howler_volume = this.global_volume * 0.01;
    if (howler_volume <= 0.01) {
        Howler.mute();
    } else {
        Howler.unmute();
        Howler.volume(this.global_volume * .01);
    }
}

SoundManager.prototype.CELESTA = celesta;
SoundManager.prototype.CLAV = clav;
SoundManager.prototype.SWELLS = swells;

SoundManager.prototype.LOGMAPPING = function (size) {
    var max_pitch = 100.0;
    var log_used = 1.0715307808111486871978099;
    var pitch = 100 - Math.min(max_pitch, Math.log(size + log_used) / Math.log(log_used));
    var index = Math.floor(pitch / 100.0 * Object.keys(celesta).length);
    return index;
}

SoundManager.prototype.FUZZ = function (index) {
    var fuzz = Math.floor(Math.random() * 4) - 2;
    return index + fuzz;
}

SoundManager.prototype.LOGANDFUZZ = function (size) {
    return SoundManager.prototype.FUZZ(SoundManager.prototype.LOGMAPPING(size));
}

SoundManager.prototype.playSound = function (size, type, volume, mapping, fuzz) {
    mapping = mapping || this.LOGANDFUZZ;
    var index = Math.round(mapping(size));

    index = Math.min(Object.keys(celesta).length - 1, index);
    index = Math.max(1, index);
    if (this.current_notes < this.note_overlap) {
        this.current_notes++;
        type[index].play();

        var self = this;
        setTimeout(function() {
            self.current_notes--;
        }, this.note_timeout);
    }
}

SoundManager.prototype.playRandomSwell = function () {
    var index = Math.round(Math.random() * (swells.length - 1));
    swells[index].play();
}

return SoundManager;
})();
