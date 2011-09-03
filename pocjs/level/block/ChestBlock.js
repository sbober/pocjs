dojo.provide("pocjs.level.block.ChestBlock");

dojo.declare("pocjs.level.block.ChestBlock", pocjs.level.block.Block, {
    open: false,

    chestSprite: null,

    constructor: function() {
        this.tex = 1;
        this.blocksMotion = true;

        this.chestSprite = new pocjs.gui.Sprite(0, 0, 0, 8 * 2 + 0, pocjs.Art.getCol(0xffff00));
        this.addSprite(this.chestSprite);
    },

    use: function(level, item) {
        if (this.open) return false;

        this.chestSprite.tex++;
        this.open = true;

        level.getLoot(this.id);
        pocjs.Sound.treasure.play();

        return true;
    }
});

