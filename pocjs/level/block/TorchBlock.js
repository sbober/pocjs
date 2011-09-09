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
        var block;
        for (var i = 0; i < 1000; i++) {
            var face = Math.random() * 4 << 0;

            block = level.getBlock(x - 1, y);
            if (face == 0 && block.solidRender && !(block instanceof pocjs.level.block.VanishBlock)) {
                this.torchSprite.x -= r;
                break;
            }

            block = level.getBlock(x, y - 1);
            if (face == 1 && block.solidRender && !(block instanceof pocjs.level.block.VanishBlock)) {
                this.torchSprite.z -= r;
                break;
            }

            block = level.getBlock(x + 1, y);
            if (face == 2 && block.solidRender && !(block instanceof pocjs.level.block.VanishBlock)) {
                this.torchSprite.x += r;
                break;
            }

            block = level.getBlock(x, y + 1);
            if (face == 3 && block.solidRender && !(block instanceof pocjs.level.block.VanishBlock)) {
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

