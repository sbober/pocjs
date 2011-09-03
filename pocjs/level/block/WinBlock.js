dojo.provide("pocjs.level.block.WinBlock");

dojo.declare("pocjs.level.block.WinBlock", pocjs.level.block.Block, {
    addEntity: function(entity) {
        this.inherited(arguments);
        if (entity instanceof pocjs.entities.Player) {
            entity.win();
        }
    }
});

