dojo.provide("pocjs.Sound");

dojo.declare("pocjs.Sound", null, {
});

dojo.mixin(pocjs.Sound, {
    loadSound: function(name) {
        var dfd = new dojo.Deferred();
        var audio = new Audio();
        var loaded = function(res) {
            if (dfd.fired == -1) dfd.resolve(name);
        };

        audio.addEventListener("canplay", loaded, false);
        audio.addEventListener("loaded", loaded, false);
        audio.src = "res/snd/" + name + ".wav";
        this[name] = audio;
        return dfd;
    }
});

