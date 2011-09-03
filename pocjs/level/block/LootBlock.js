dojo.provide("pocjs.level.block.LootBlock");

dojo.declare("pocjs.level.block.LootBlock", pocjs.level.block.Block, {
    taken: false,
    sprite: null,

    constructor: function() {
        this.sprite = new pocjs.gui.Sprite(
            0, 0, 0, 16 + 2, pocjs.Art.getCol(0xffff80)
        );
        this.addSprite(this.sprite);
        this.blocksMotion = true;
    },

    addEntity: function(entity) {
        this.inherited(arguments,[entity]);
        if (!this.taken && entity instanceof pocjs.entities.Player) {
            this.sprite.removed = true;
            this.taken = true;
            this.blocksMotion = false;
            entity.loot++;
            pocjs.Sound.pickup.play();
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Player) return false;
        return this.blocksMotion;
    }
});

