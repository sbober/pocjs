dojo.provide("pocjs.menu.LoseMenu");

dojo.declare("pocjs.menu.LoseMenu", pocjs.menu.Menu, {
	
    tickDelay: 30,
    player: null,

    constructor: function(player) {
            this.player = player;
    },

    render: function(target) {
        target.drawPart(pocjs.Art.logo, 0, 10, 0, 39, 160, 23, pocjs.Art.getCol(0xffffff));

        var seconds = player.time / 60 << 0;
        var minutes = seconds / 60 << 0;
        seconds %= 60;
        var timeString = minutes + ":";
        if (seconds < 10) timeString += "0";
        timeString += seconds;
        target.drawString(
            "Trinkets: " + player.loot + "/12",
            40, 45 + 10 * 0, pocjs.Art.getCol(0x909090));
        target.drawString(
            "Time: " + timeString,
            40, 45 + 10 * 1, pocjs.Art.getCol(0x909090));

        if (this.tickDelay == 0)
            target.drawString(
                "-> Continue", 40, target.height - 40, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});

