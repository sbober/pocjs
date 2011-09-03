dojo.provide("pocjs.level.StartLevel");

dojo.declare("pocjs.level.StartLevel", pocjs.level.Level, {
    constructor: function() {
        this.name = "The Prison";
    },

    decorateBlock: function(x, y, block, col) {
        this.inherited(arguments);
    },

    getNewBlock: function(x, y, col) {
        return this.inherited(arguments);
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("overworld", 1);
            if (id == 2) this.game.switchLevel("dungeon", 1);
    },

    getLoot: function(id) {
        this.inherited(arguments);
    }
});
