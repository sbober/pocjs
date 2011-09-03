dojo.provide("pocjs.level.block.VanishBlock");

dojo.declare("pocjs.level.block.VanishBlock", pocjs.level.block.SolidBlock, {
    gone: false,

    constructor: function() {
        this.tex = 1;
    },

    use: function(level, item) {
        if (this.gone) return false;

        this.gone = true;
        this.blocksMotion = false;
        this.solidRender = false;
        pocjs.Sound.crumble.play();

        for (var i = 0; i < 32; i++) {
            var sprite = new pocjs.gui.RubbleSprite();
            sprite.col = this.col;
            this.addSprite(sprite);
        }

        return true;
    }
});

