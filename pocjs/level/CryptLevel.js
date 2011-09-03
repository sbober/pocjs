dojo.provide("pocjs.level.CryptLevel");

dojo.declare("pocjs.level.CryptLevel", pocjs.level.Level, {
    constructor: function() {
            this.floorCol = 0x404040;
            this.ceilCol = 0x404040;
            this.wallCol = 0x404040;
            this.name = "The Crypt";
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("overworld", 2);
    },

    getLoot: function(id) {
            this.inherited(arguments);
            if (id == 1) this.game.getLoot(pocjs.entities.Item.flippers);
    }
});
