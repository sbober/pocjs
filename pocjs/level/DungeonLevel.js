dojo.provide("pocjs.level.DungeonLevel");

dojo.declare("pocjs.level.DungeonLevel", pocjs.level.Level, {
    constructor: function() {
        this.wallCol = 0xC64954;
        this.floorCol = 0x8E4A51;
        this.ceilCol = 0x8E4A51;
        this.name = "The Dungeons";
    },

    init: function(game, name, w, h, pixels) {
        this.inherited(arguments);
        this.inherited("trigger", [6, true]);
        this.inherited("trigger",[7, true]);
    },

    switchLevel: function(id) {
        if (id == 1) this.game.switchLevel("start", 2);
    },

    getLoot: function(id) {
        this.inherited(arguments);
        if (id == 1) this.game.getLoot(pocjs.entities.Item.powerGlove);
    },

    trigger: function(id, pressed) {
        this.inherited(arguments);
        if (id == 5) this.inherited("trigger", [6, !pressed]);
        if (id == 4) this.inherited("trigger", [7, !pressed]);
    }
});
