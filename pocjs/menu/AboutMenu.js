dojo.provide("pocjs.menu.AboutMenu");

dojo.declare("pocjs.menu.AboutMenu", pocjs.menu.Menu, {

    tickDelay: 30,

    render: function(target) {
        target.fill(0, 0, 160, 120, 0);

        target.drawString("About", 60, 8, pocjs.Art.getCol(0xffffff));
        
        var lines = [
            "Prelude of the Chambered",
            "by Markus Persson.",
            "Made Aug 2011 for the",
            "21'st Ludum Dare compo.",
            "",
            "This game is freeware,",
            "and was made from scratch",
            "in just 48 hours."
        ];
        
        for (var i = 0; i < lines.length; i++) {
            target.drawString(lines[i], 4, 28+i*8, pocjs.Art.getCol(0xa0a0a0));
        }

        if (this.tickDelay == 0)
            target.drawString("-> Continue", 40, target.height - 16, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});

