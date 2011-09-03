dojo.provide("pocjs.level.block.SolidBlock");

dojo.declare("pocjs.level.block.SolidBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.solidRender = true;
        this.blocksMotion = true;
    }
});

