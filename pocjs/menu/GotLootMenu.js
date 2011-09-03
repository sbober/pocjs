dojo.provide("pocjs.menu.GotLootMenu");

dojo.declare("pocjs.menu.GotLootMenu", pocjs.menu.Menu, {
    tickDelay: 30,
    item: null,

    constructor: function(item) {
        this.item = item;
    },

    render: function(target) {
        var str = "You found the " + this.item.name + "!";
        target.scaleDraw(
            pocjs.Art.items, 3, 
            target.width / 2 - 8 * 3, 2, this.item.icon * 16, 0, 16, 16,
            pocjs.Art.getCol(this.item.color));
        target.drawString(
            str, (target.width - str.length * 6) / 2 + 2, 60 - 10,
            pocjs.Art.getCol(0xffff80));

        str = this.item.description;
        target.drawString(
            str, (target.width - str.length * 6) / 2 + 2, 60,
            pocjs.Art.getCol(0xa0a0a0));

        if (this.tickDelay == 0)
            target.drawString("-> Continue", 40, target.height - 40, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            game.setMenu(null);
        }
    }
});

