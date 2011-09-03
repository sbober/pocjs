dojo.provide("pocjs.gui.PoofSprite");


dojo.declare("pocjs.gui.PoofSprite", pocjs.gui.Sprite, {
    life: 20,


    "-chains-": {constructor: "manual"},
    constructor: function(x, y, z) {
        this.inherited(arguments, [x, y, z, 5, 0x222222]);
    },

    tick: function() {
	if (this.life-- <= 0) this.removed = true;
    }
});
