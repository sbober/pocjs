dojo.provide("pocjs.level.block.IceBlock");

dojo.declare("pocjs.level.block.IceBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.blocksMotion = false;
        this.floorTex = 16;
    },

    tick: function() {
        this.inherited(arguments);
        this.floorCol = pocjs.Art.getCol(0x8080ff);
    },

    getWalkSpeed: function(player) {
        if (player.getSelectedItem() == pocjs.entities.Item.skates) return 0.05;
        return 1.4;
    },

    getFriction: function(player) {
        if (player.getSelectedItem() == pocjs.entities.Item.skates) return 0.98;
        return 1;
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Player) return false;
        if (entity instanceof pocjs.entities.Bullet) return false;
        if (entity instanceof pocjs.entities.EyeBossEntity) return false;
        if (entity instanceof pocjs.entities.EyeEntity) return false;
        return true;
    }
});

