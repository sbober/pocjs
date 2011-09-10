dojo.provide("pocjs.Sound");

dojo.declare("pocjs.Sound", null, {
});

dojo.mixin(pocjs.Sound, {
    loadSound: function(name) {
        var dfd = new dojo.Deferred();
        var audio = new Audio();
        audio.addEventListener("canplay", function(res) {
            if (dfd.fired == -1) dfd.resolve(name);
        }, false);
        audio.src = "res/snd/" + name + ".wav";
        this[name] = audio;
        return dfd;
    }
});

