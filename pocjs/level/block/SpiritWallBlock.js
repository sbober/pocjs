dojo.provide("pocjs.level.block.SpiritWallBlock");

dojo.declare("pocjs.level.block.SpiritWallBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.floorTex = 7;
        this.ceilTex = 7;
        this.blocksMotion = true;
        for (var i = 0; i < 6; i++) {
            var x = (Math.random() - 0.5);
            var y = (Math.random() - 0.7) * 0.3;
            var z = (Math.random() - 0.5);
            this.addSprite(
                new pocjs.gui.Sprite(
                    x, y, z,
                    4 * 8 + 6 + Math.random() * 2 << 0,
                    pocjs.Art.getCol(0x202020)));
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Bullet) return false;
        return this.inherited(arguments);
    }
});
