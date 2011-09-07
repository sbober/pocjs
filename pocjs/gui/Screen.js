dojo.provide("pocjs.gui.Screen");

dojo.declare("pocjs.gui.Screen", pocjs.gui.Bitmap, {
    PANEL_HEIGHT: 29,

    viewport: null,
    time: null,


    //"-chains-": {constructor: "manual"},
    constructor: function(width, height) {
        //this.inherited(arguments);

        this.viewport = new pocjs.gui.Bitmap3D(width, height - this.PANEL_HEIGHT);
    },

    render: function(game) {
        if (game.level == null) {
            this.fill(0, 0, this.width, this.height, 0);
        } else {
            var itemUsed = game.player.itemUseTime > 0;
            var item = game.player.items[game.player.selectedSlot];

            if (game.pauseTime > 0) {
                this.fill(0, 0, this.width, this.height, 0);
                var messages = [ "Entering " + game.level.name ];
                for (var y = 0; y < messages.length; y++) {
                    this.drawString(
                            messages[y], 
                            (this.width - messages[y].length * 6) / 2,
                            (this.viewport.height - messages.length * 8) / 2 + y * 8 + 1,
                            0x111111);
                    this.drawString(
                            messages[y],
                            (this.width - messages[y].length * 6) / 2,
                            (this.viewport.height - messages.length * 8) / 2 + y * 8,
                            0x555544);
                }
            } else {
                this.viewport.render(game);
                this.viewport.postProcess(game.level);

                var block = game.level.getBlock(
                        (game.player.x + 0.5) << 0, 
                        (game.player.z + 0.5) << 0
                );
                if (block.messages != null) {
                    for (var y = 0; y < block.messages.length; y++) {
                        this.viewport.drawPart(
                                block.messages[y],
                                (this.width - block.messages[y].length * 6) / 2,
                                (this.viewport.height - block.messages.length * 8) / 2 + y * 8 + 1,
                                0x111111);
                        this.viewport.drawPart(
                                block.messages[y],
                                (this.width - block.messages[y].length * 6) / 2, 
                                (this.viewport.height - block.messages.length * 8) / 2 + y * 8,
                                0x555544);
                    }
                }

                this.draw(this.viewport, 0, 0);
                var xx = (game.player.turnBob * 32) << 0 ;
                var yy = (Math.sin(game.player.bobPhase * 0.4) * 1 * game.player.bob + game.player.bob * 2) << 0;

                if (itemUsed) xx = yy = 0;
                xx += (this.width / 2 << 0);
                yy += (this.height - this.PANEL_HEIGHT - 15 * 3);
                if (item != pocjs.entities.Item.none) {
                    this.scaleDraw(pocjs.Art.items, 3, xx, yy, 16 * item.icon + 1, 16 + 1 + (itemUsed ? 16 : 0), 15, 15, pocjs.Art.getCol(item.color));
                }

                if (game.player.hurtTime > 0 || game.player.dead) {
                    var offs = 1.5 - game.player.hurtTime / 30.0;
                    if (game.player.dead) offs = 0.5;
                    for (var i = 0; i < this.pixels.length; i++) {
                        var xp = ((i % this.width) - this.viewport.width / 2.0) / this.width * 2;
                        var yp = ((i / this.width) - this.viewport.height / 2.0) / this.viewport.height * 2;

                        if (Math.random() + offs < Math.sqrt(xp * xp + yp * yp)) this.pixels[i] = Math.floor(Math.floor(Math.random() * 5)  / 4) * 0x550000;
                    }
                }
            }

            this.drawPart(pocjs.Art.panel, 0, this.height - this.PANEL_HEIGHT, 0, 0, this.width, this.PANEL_HEIGHT, pocjs.Art.getCol(0x707070));

            this.drawString("å", 3, this.height - 26 + 0, 0x00ffff);
            this.drawString("" + game.player.keys + "/4", 10, this.height - 26 + 0, 0xffffff);
            this.drawString("Ä", 3, this.height - 26 + 8, 0xffff00);
            this.drawString("" + game.player.loot, 10, this.height - 26 + 8, 0xffffff);
            this.drawString("Å", 3, this.height - 26 + 16, 0xff0000);
            this.drawString("" + game.player.health, 10, this.height - 26 + 16, 0xffffff);

            for (var i = 0; i < 8; i++) {
                var slotItem = game.player.items[i];
                if (slotItem != pocjs.entities.Item.none) {
                    this.drawPart(pocjs.Art.items, 30 + i * 16, this.height - this.PANEL_HEIGHT + 2, slotItem.icon * 16, 0, 16, 16, pocjs.Art.getCol(slotItem.color));
                    if (slotItem == pocjs.entities.Item.pistol) {
                        var str = "" + game.player.ammo;
                        this.drawString(str, 30 + i * 16 + 17 - str.length * 6, this.height - this.PANEL_HEIGHT + 1 + 10, 0x555555);
                    }
                    if (slotItem == pocjs.entities.Item.potion) {
                        var str = "" + game.player.potions;
                        this.drawString(str, 30 + i * 16 + 17 - str.length * 6, this.height - this.PANEL_HEIGHT + 1 + 10, 0x555555);
                    }
                }
            }

            this.drawPart(pocjs.Art.items, 30 + game.player.selectedSlot * 16, this.height - this.PANEL_HEIGHT + 2, 0, 48, 17, 17, pocjs.Art.getCol(0xffffff));

            this.drawString(item.name, 26 + (8 * 16 - item.name.length * 4) / 2, this.height - 9, 0xffffff);
        }

        if (game.menu != null) {
            for (var i = 0; i < this.pixels.length; i++) {
                this.pixels[i] = (this.pixels[i] & 0xfcfcfc) >> 2;
            }			
            game.menu.render(this);
        }

    }
});

