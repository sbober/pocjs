dojo.provide("pocjs.level.block.LockedDoorBlock");

dojo.declare("pocjs.level.block.LockedDoorBlock", pocjs.level.block.DoorBlock, {
    constructor: function() {
        this.tex = 5;
    },

    use: function(level, item) {
        return false;
    },

    trigger: function(pressed) {
        this.open = pressed;
    }

});
