dojo.provide("pocjs.level.block.WaterBlock");

dojo.declare("pocjs.level.block.WaterBlock", pocjs.level.block.Block, {
    steps: 0,

    constructor: function() {
        this.blocksMotion = true;
    },

    tick: function() {
        this.inherited(arguments);
        this.steps--;
        if (this.steps <= 0) {
            this.floorTex = 8 + Math.random() * 3 << 0;
            this.floorCol = pocjs.Art.getCol(0x0000ff);
            this.steps = 16;
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Player) {
            if (entity.getSelectedItem() == pocjs.entities.Item.flippers) return false;
        }
        if (entity instanceof pocjs.entities.Bullet) return false;
        return this.blocksMotion;
    },

    getFloorHeight: function(e) {
        return -0.5;
    },

    getWalkSpeed: function(player) {
        return 0.4;
    }

});
