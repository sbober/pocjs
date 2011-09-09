dojo.provide("pocjs.level.block.PitBlock");

dojo.declare("pocjs.level.block.PitBlock", pocjs.level.block.Block, {
    filled: false,

    constructor: function() {
        this.floorTex = 1;
        this.blocksMotion = true;
    },

    addEntity: function(entity) {
        this.inherited(arguments);
        if (!this.filled && entity instanceof pocjs.entities.BoulderEntity) {
            entity.remove();
            this.filled = true;
            this.blocksMotion = false;
            this.addSprite(
                new pocjs.gui.Sprite(0, 0, 0, 8 + 2, pocjs.entities.BoulderEntity.prototype.COLOR)
            );
            pocjs.Sound.thud.play();
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.BoulderEntity) return false;
        return this.blocksMotion;
    }
});

