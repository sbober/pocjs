dojo.provide("pocjs.level.block.LadderBlock");

dojo.declare("pocjs.level.block.LadderBlock", pocjs.level.block.Block, {
    LADDER_COLOR: 0xDB8E53,
    wait: null,

    constructor: function(down) {
        if (down) {
            this.floorTex = 1;
            this.addSprite(
                new pocjs.gui.Sprite(
                    0, 0, 0, 8 + 3, pocjs.Art.getCol(this.LADDER_COLOR)));
        }
        else {
            this.ceilTex = 1;
            this.addSprite(
                new pocjs.gui.Sprite(
                    0, 0, 0, 8 + 4, pocjs.Art.getCol(this.LADDER_COLOR)));
        }
    },

    removeEntity: function(entity) {
        this.inherited(arguments);
        if (entity instanceof pocjs.entities.Player) {
            this.wait = false;
        }
    },

    addEntity: function(entity) {
        this.inherited(arguments);

        if (!this.wait && entity instanceof pocjs.entities.Player) {
            this.level.switchLevel(this.id);
            pocjs.Sound.ladder.play();
        }
    }
});

