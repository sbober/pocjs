dojo.provide("pocjs.menu.PauseMenu");

dojo.declare("pocjs.menu.PauseMenu", pocjs.menu.Menu, {

    options: [ "Abort game", "Continue" ],
    selected: 1,

    render: function(target) {
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
    },

    tick: function(game, up, down, left, right, use) {
        if (up || down) pocjs.Sound.click2.play();
        if (up) this.selected--;
        if (down) this.selected++;
        if (this.selected < 0) sthis.elected = 0;
        if (this.selected >= this.options.length) this.selected = this.options.length - 1;
        if (use) {
            pocjs.Sound.click1.play();
            if (this.selected == 0) {
                game.setMenu(new pocjs.menu.TitleMenu());
            }
            if (this.selected == 1) {
                game.setMenu(null);
            }
        }
    }
});

