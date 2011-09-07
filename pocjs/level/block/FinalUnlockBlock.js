dojo.provide("pocjs.level.block.FinalUnlockBlock");

dojo.declare("pocjs.level.block.FinalUnlockBlock", pocjs.level.block.SolidBlock, {
    pressed: false,

    constructor: function() {
        this.tex = 8 + 3;
    },

    use: function(level, item) {
        if (this.pressed) return false;
        if (level.player.keys < 4) return false;

        pocjs.Sound.click1.play();
        this.pressed = true;
        level.trigger(this.id, true);

        return true;
    }
});

