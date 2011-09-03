dojo.provide("pocjs.level.block.SwitchBlock");

dojo.declare("pocjs.level.block.SwitchBlock", pocjs.level.block.SolidBlock, {
    pressed: false,

    constructor: function() {
        this.tex = 2;
    },

    use: function(level, item) {
        this.pressed = !this.pressed;
        if (this.pressed) this.tex = 3;
        else this.tex = 2;
        
        level.trigger(this.id, this.pressed);
        if (this.pressed)
            pocjs.Sound.click1.play();
        else
            pocjs.Sound.click2.play();

        return true;
    }
});
