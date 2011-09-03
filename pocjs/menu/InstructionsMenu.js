dojo.provide("pocjs.menu.InstructionsMenu");

dojo.declare("pocjs.menu.InstructionsMenu", pocjs.menu.Menu, {

    tickDelay: 30,

    render: function(target) {
        target.fill(0, 0, 160, 120, 0);

        target.drawString("Instructions", 40, 8, pocjs.Art.getCol(0xffffff));
        
        var lines = [
            "Use W,A,S,D to move, and",
            "the arrow keys to turn.",
            "",
            "The 1-8 keys select",
            "items from the inventory",
            "",
            "Space uses items",
        ];
        
        for (var i=0; i<lines.length; i++) {
            target.drawString(lines[i], 4, 32+i*8, pocjs.Art.getCol(0xa0a0a0));
        }

        if (this.tickDelay == 0)
            target.draw("-> Continue", 40, target.height - 16, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});

