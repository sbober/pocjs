dojo.provide("pocjs.level.block.AltarBlock");

dojo.declare("pocjs.level.block.AltarBlock", pocjs.level.block.Block, {
    filled: false,
    sprite: null,

    constructor: function() {
        this.blocksMotion = true;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 16 + 4, pocjs.Art.getCol(0xE2FFE4));
        this.addSprite(this.sprite);
    },

    addEntity: function(entity) {
        this.inherited(arguments);
        if (!this.filled && (
                entity instanceof pocjs.entities.GhostEntity ||
                entity instanceof pocjs.entities.GhostBossEntity)) {
            entity.remove();
            this.filled = true;
            this.blocksMotion = false;
            this.sprite.removed = true;

            for (var i = 0; i < 8; i++) {
                var sprite = new pocjs.gui.RubbleSprite();
                sprite.col = this.sprite.col;
                this.addSprite(sprite);
            }

            if (entity instanceof pocjs.entities.GhostBossEntity) {
                this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.y));
                pocjs.Sound.bosskill.play();
            } else {
                pocjs.Sound.altar.play();
            }
        }
    },

    blocks: function(entity) {
        return this.blocksMotion;
    }
});
