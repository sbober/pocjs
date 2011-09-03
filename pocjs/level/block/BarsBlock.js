dojo.provide("pocjs.level.block.BarsBlock");

dojo.declare("pocjs.level.block.BarsBlock", pocjs.level.block.Block, {
    sprite: null,
    open: false,

    constructor: function() {
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 0, 0x202020);
        this.addSprite(this.sprite);
        this.blocksMotion = true;
    },

    use: function(level, item) {
        if (this.open) return false;

        if (item == pocjs.entities.Item.cutters) {
            pocjs.Sound.cut.play();
            this.sprite.tex = 1;
            this.open = true;
        }

        return true;
    },

    blocks: function(entity) {
        if (this.open && entity instanceof pocjs.entities.Player) return false;
        if (this.open && entity instanceof pocjs.entities.Bullet) return false;
        return this.blocksMotion;
    }
});
