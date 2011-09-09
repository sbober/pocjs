dojo.provide("pocjs.level.IceLevel");

dojo.declare("pocjs.level.IceLevel", pocjs.level.Level, {
    constructor: function() {
            this.ceilCol =  0xB8DBE0;
            this.floorCol = 0xB8DBE0;
            this.wallCol =  0x6BE8FF;
            this.name = "The Frost Cave";
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("overworld", 5);
    },

    getLoot: function(id) {
            this.inherited(arguments);
            if (id == 1) this.game.getLoot(pocjs.entities.Item.skates);
    }

});
