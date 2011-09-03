dojo.provide("pocjs.level.Level");

dojo.declare("pocjs.level.Level", null, {

    blocks: null,
    width: null, height: null,

    xSpawn: null,
    ySpawn: null,

    wallCol: 0xB3CEE2,
    floorCol: 0x9CA09B,
    ceilCol: 0x9CA09B,

    wallTex: 0,
    floorTex: 0,
    ceilTex: 0,

    entities: null,
    game: null,
    name: "",

    player: null,



    init: function(game, name, w, h, pixels) {
        this.game = game;

        this.player = game.player;

        this.solidWall = new pocjs.level.block.SolidBlock();
        this.solidWall.col = pocjs.Art.getCol(this.wallCol);
        this.solidWall.tex = pocjs.Art.getCol(this.wallTex);
        this.width = w;
        this.height = h;
        this.blocks = new Array(w * h << 0 );
        this.entities = [];

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var col = pixels[x + y * w] & 0xffffff;
                if(x == 22 && y == 34)
                console.log("col: " + pixels[x+y*w]);
                var id = 255 - ((pixels[x + y * w] >> 24) & 0xff);

                var block = this.getNewBlock(x, y, col);
                if(x == 22 && y == 34)
                console.log("x/y/col/type: " + x + "/" + y + "/" + col.toString(16) +  "/" + block.declaredClass);
                block.id = id;

                if (block.tex == -1) block.tex = this.wallTex;
                if (block.floorTex == -1) block.floorTex = this.floorTex;
                if (block.ceilTex == -1) block.ceilTex = this.ceilTex;
                if (block.col == -1) block.col = pocjs.Art.getCol(this.wallCol);
                if (block.floorCol == -1) block.floorCol = pocjs.Art.getCol(this.floorCol);
                if (block.ceilCol == -1) block.ceilCol = pocjs.Art.getCol(this.ceilCol);

                block.level = this;
                block.x = x;
                block.y = y;
                this.blocks[x + y * w] = block;

            }
        }
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var col = pixels[x + y * w] & 0xffffff;
                this.decorateBlock(x, y, block, col);
            }
        }
    },

    addEntity: function(e) {
        this.entities.push(e);
        e.level = this;
        e.updatePos();
    },

    removeEntityImmediately: function(player) {
        var index = this.entities.indexOf(player);
        if (index < 0) throw "element not found";

        this.entities.slice(index, 1);
        this.getBlock(player.xTileO, player.zTileO).removeEntity(player);
    },

    decorateBlock: function(x, y, block, col) {
        block.decorate(this, x, y);
        if (col == 0xFFFF00) {
            this.xSpawn = x;
            this.ySpawn = y;
        }
        if (col == 0xAA5500) this.addEntity(new pocjs.entities.BoulderEntity(x, y));
        if (col == 0xff0000) this.addEntity(new pocjs.entities.BatEntity(x, y));
        if (col == 0xff0001) this.addEntity(new pocjs.entities.BatBossEntity(x, y));
        if (col == 0xff0002) this.addEntity(new pocjs.entities.OgreEntity(x, y));
        if (col == 0xff0003) this.addEntity(new pocjs.entities.BossOgre(x, y));
        if (col == 0xff0004) this.addEntity(new pocjs.entities.EyeEntity(x, y));
        if (col == 0xff0005) this.addEntity(new pocjs.entities.EyeBossEntity(x, y));
        if (col == 0xff0006) this.addEntity(new pocjs.entities.GhostEntity(x, y));
        if (col == 0xff0007) this.addEntity(new pocjs.entities.GhostBossEntity(x, y));
        if (col == 0x1A2108 || col == 0xff0007) {
            block.floorTex = 7;
            block.ceilTex = 7;
        }

        if (col == 0xC6C6C6) block.col = pocjs.Art.getCol(0xa0a0a0);
        if (col == 0xC6C697) block.col = pocjs.Art.getCol(0xa0a0a0);
        if (col == 0x653A00) {
            block.floorCol = pocjs.Art.getCol(0xB56600);
            block.floorTex = 3 * 8 + 1;
        }

        if (col == 0x93FF9B) {
            block.col = pocjs.Art.getCol(0x2AAF33);
            block.tex = 8;
        }
    },

    getNewBlock: function(x, y, col) {
        if (col == 0x93FF9B) return new pocjs.level.block.SolidBlock();
        if (col == 0x009300) return new pocjs.level.block.PitBlock();
        if (col == 0xFFFFFF) return new pocjs.level.block.SolidBlock();
        if (col == 0x00FFFF) return new pocjs.level.block.VanishBlock();
        if (col == 0xFFFF64) return new pocjs.level.block.ChestBlock();
        if (col == 0x0000FF) return new pocjs.level.block.WaterBlock();
        if (col == 0xFF3A02) return new pocjs.level.block.TorchBlock();
        if (col == 0x4C4C4C) return new pocjs.level.block.BarsBlock();
        if (col == 0xFF66FF) return new pocjs.level.block.LadderBlock(false);
        if (col == 0x9E009E) return new pocjs.level.block.LadderBlock(true);
        if (col == 0xC1C14D) return new pocjs.level.block.LootBlock();
        if (col == 0xC6C6C6) return new pocjs.level.block.DoorBlock();
        if (col == 0x00FFA7) return new pocjs.level.block.SwitchBlock();
        if (col == 0x009380) return new pocjs.level.block.PressurePlateBlock();
        if (col == 0xff0005) return new pocjs.level.block.IceBlock();
        if (col == 0x3F3F60) return new pocjs.level.block.IceBlock();
        if (col == 0xC6C697) return new pocjs.level.block.LockedDoorBlock();
        if (col == 0xFFBA02) return new pocjs.level.block.AltarBlock();
        if (col == 0x749327) return new pocjs.level.block.SpiritWallBlock();
        if (col == 0x1A2108) return new pocjs.level.block.Block();
        if (col == 0x00C2A7) return new pocjs.level.block.FinalUnlockBlock();
        if (col == 0x000056) return new pocjs.level.block.WinBlock();

        return new pocjs.level.block.Block();
    },

    getBlock: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return this.solidWall;
        }

        var b = this.blocks[x + y * this.width];
        return b;
    },


    containsBlockingEntity: function(x0, y0, x1, y1) {
        var xc = Math.floor((x1 + x0) / 2);
        var zc = Math.floor((y1 + y0) / 2);
        var rr = 2;
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (e.isInside(x0, y0, x1, y1)) return true;
                }
            }
        }
        return false;
    },

    containsBlockingNonFlyingEntity: function(x0, y0, x1, y1) {
        var xc = Math.floor((x1 + x0) / 2);
        var zc = Math.floor((y1 + y0) / 2);
        var rr = 2;
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (!e.flying && e.isInside(x0, y0, x1, y1)) return true;
                }
            }
        }
        return false;
    },

    tick: function() {
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            e.tick();
            e.updatePos();
            if (e.isRemoved()) {
                this.entities.splice(i, 1);
                i--;
            }
        }

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                this.blocks[x + y * this.width].tick();
            }
        }
    },

    trigger: function(id, pressed) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var b = this.blocks[x + y * this.width];
                if (b.id == id) {
                    b.trigger(pressed);
                }
            }
        }
    },

    switchLevel: function(id) {
    },

    findSpawn: function(id) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var b = this.blocks[x + y * this.width];
                if (b.id == id && b instanceof pocjs.level.block.LadderBlock) {
                    this.xSpawn = x;
                    this.ySpawn = y;
                }
            }
        }
    },

    getLoot: function(id) {
        if (id == 20) this.game.getLoot(pocjs.entities.Item.pistol);
        if (id == 21) this.game.getLoot(pocjs.entities.Item.potion);
    },

    win: function() {
        this.game.win(this.player);
    },

    lose: function() {
        this.game.lose(this.player);
    },

    showLootScreen: function(item) {
        this.game.setMenu(new pocjs.menu.GotLootMenu(item));
    }
});


dojo.mixin(pocjs.level.Level, {
    loaded: {},
    pixels: {},
    dims:   {},
    clear: function() {
        this.loaded = {};
    },

    loadLevelBitmap: function(name) {

        var self = this;

        var dfd = new dojo.Deferred();
        console.log("level name: " + name);
        PNG.load("res/level/" + name + ".png", function(png) {
            var w = png.width;
            var h = png.height;
            var pixels = new Array(w * h << 0);
            var ppix = png.decodePixels();

            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var data = ppix[y][x];

                    var input = data[3] << 24
                              | data[0] << 16
                              | data[1] << 8
                              | data[2];
                    pixels[x + y*w] = input;
                }
            }

            self.pixels[name] = pixels;
            self.dims[name] = {w: w, h: h};
            dfd.resolve(name);
        });
        return dfd;

    },

    loadLevel: function(game, name) {
        if (name in this.loaded) return this.loaded[name];
        var level = this.byName(name);
        level.init(game, name, this.dims[name].w, this.dims[name].h, this.pixels[name]);
        this.loaded[name] = level;
        return level;
    },

    byName: function(name) {
        var clazz = "pocjs.level." + name.slice(0, 1).toUpperCase() + name.slice(1) + "Level";
        //dojo.require(clazz);
        return new dojo.getObject(clazz)();
    }
});

