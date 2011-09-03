dojo.provide("pocjs.level.TempleLevel");

dojo.declare("pocjs.level.TempleLevel", pocjs.level.Level, {
    triggerMask: 0,

    constructor: function() {
        this.floorCol = 0x8A6496;
        this.ceilCol = 0x8A6496;
        this.wallCol = 0xCFADDB;
        this.name = "The Temple";
    },

    switchLevel: function(id) {
        if (id == 1) this.game.switchLevel("overworld", 3);
    },

    getLoot: function(id) {
        this.inherited(arguments);
        if (id == 1) this.game.getLoot(pocjs.entities.Item.skates);
    },

    trigger: function(id, pressed) {
        this.triggerMask |= 1 << id;
        this.inherited(arguments);
        if (!pressed) this.triggerMask ^= 1 << id;

        if (this.triggerMask == 14) {
                this.inherited(arguments, [1, true]);
        } else {
                this.inherited(arguments, [1, false]);
        }
    }
});
