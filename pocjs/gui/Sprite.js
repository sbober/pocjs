dojo.provide("pocjs.gui.Sprite");

dojo.declare("pocjs.gui.Sprite", null, {
    x: null, y: null, z:null,
    tex: null,
    col: 0x202020,
    removed: false,

    constructor: function(x, y, z, tex, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.tex = tex;
        this.col = color;
    },

    tick: function() {
    }
});

