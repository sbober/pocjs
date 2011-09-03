dojo.provide("pocjs.menu.TitleMenu");

dojo.declare("pocjs.menu.TitleMenu", pocjs.menu.Menu, {

    options: [ "New game", "Instructions", "About" ],
    selected: 0,
    firstTick: true,

    render: function(target) {
        target.fill(0, 0, 160, 120, 0);
        target.drawPart(pocjs.Art.logo, 0, 8, 0, 0, 160, 36, pocjs.Art.getCol(0xffffff));

        for (var i = 0; i < this.options.length; i++) {
            var msg = this.options[i];
            var col = 0x909090;
            if (this.selected == i) {
                msg = "-> " + msg;
                col = 0xffff80;
            }
            target.drawString(msg, 40, 60 + i * 10, pocjs.Art.getCol(col));
        }
        target.drawString(
            "Copyright (C) 2011 Mojang", 1+4, 120 - 9, pocjs.Art.getCol(0x303030));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.firstTick) {
            this.firstTick = false;
            pocjs.Sound.altar.play();
        }
        if (up || down) pocjs.Sound.click2.play();
        if (up) this.selected--;
        if (down) this.selected++;
        if (this.selected < 0) this.selected = 0;
        if (this.selected >= this.options.length) this.selected = this.options.length - 1;
        if (use) {
            pocjs.Sound.click1.play();
            if (this.selected == 0) {
                game.setMenu(null);
                game.newGame();
            }
            if (this.selected == 1) {
                game.setMenu(new pocjs.menu.InstructionsMenu());
            }
            if (this.selected == 2) {
                game.setMenu(new pocjs.menu.AboutMenu());
            }
        }
    }
});

