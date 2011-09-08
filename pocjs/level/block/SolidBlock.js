dojo.provide("pocjs.level.block.SolidBlock");

dojo.declare("pocjs.level.block.SolidBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.solidRender = true;
        this.blocksMotion = true;
    }
});

dojo.extend(pocjs.level.block.Block, {
    solidWall: new pocjs.level.block.SolidBlock()
});
