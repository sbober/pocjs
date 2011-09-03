dojo.provide("pocjs.level.block.TorchBlock");

dojo.declare("pocjs.level.block.TorchBlock", pocjs.level.block.Block, {
    torchSprite: null,

    constructor: function() {
        this.torchSprite = new pocjs.gui.Sprite(0, 0, 0, 3, pocjs.Art.getCol(0xffff00));
        this.sprites.push(this.torchSprite);
    },

    decorate: function(level, x, y) {
//        Random random = new Random((x + y * 1000) * 341871231);
        var r = 0.4;
        for (var i = 0; i < 1000; i++) {
            var face = Math.random() * 4 << 0;
            if (face == 0 && level.getBlock(x - 1, y).solidRender) {
                this.torchSprite.x -= r;
                break;
            }
            if (face == 1 && level.getBlock(x, y - 1).solidRender) {
                this.torchSprite.z -= r;
                break;
            }
            if (face == 2 && level.getBlock(x + 1, y).solidRender) {
                this.torchSprite.x += r;
                break;
            }
            if (face == 3 && level.getBlock(x, y + 1).solidRender) {
                this.torchSprite.z += r;
                break;
            }
        }
    },

    tick: function() {
        this.inherited(arguments);
        if ((Math.random() * 4 << 0) == 0)
            this.torchSprite.tex = 3 + (Math.random() * 2 << 0);
    }
});

