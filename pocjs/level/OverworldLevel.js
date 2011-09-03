dojo.provide("pocjs.level.OverworldLevel");

dojo.declare("pocjs.level.OverworldLevel", pocjs.level.Level, {
    contructor: function() {
            this.ceilTex = -1;
            this.floorCol = 0x508253;
            this.floorTex = 8 * 3;
            this.wallCol = 0xa0a0a0;
            this.name = "The Island";
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("start", 1);
            if (id == 2) this.game.switchLevel("crypt", 1);
            if (id == 3) this.game.switchLevel("temple", 1);
            if (id == 5) this.game.switchLevel("ice", 1);
    },

    getLoot: function(id) {
            this.inherited(arguments);
            if (id == 1) this.game.getLoot(pocjs.entities.Item.cutters);
    }
});

