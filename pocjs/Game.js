dojo.provide("pocjs.Game");

dojo.declare("pocjs.Game", null,  {
    time: null,
    level: null,
    player: null,
    pauseTime: null,
    menu: null,

    constructor: function() {
        this.setMenu(new pocjs.menu.TitleMenu());
    },

    newGame: function() {
        pocjs.level.Level.clear();
        this.level = pocjs.level.Level.loadLevel(this, "start");
        this.player = new pocjs.entities.Player();
        this.player.level = this.level;
        this.level.player = this.player;
        this.player.x = this.level.xSpawn;
        this.player.z = this.level.ySpawn;
        this.level.addEntity(this.player);
        this.player.rot = Math.PI + 0.4;
    },


    switchLevel: function(name, id) {
        this.pauseTime = 30;
        this.level.removeEntityImmediately(this.player);
        this.level = pocjs.level.Level.loadLevel(this, name);
        this.level.findSpawn(id);
        this.player.x = this.level.xSpawn;
        this.player.z = this.level.ySpawn;
        this.level.getBlock(this.level.xSpawn, this.level.ySpawn).wait = true;
        this.player.x += Math.sin(this.player.rot) * 0.2;
        this.player.z += Math.cos(this.player.rot) * 0.2;
        this.level.addEntity(this.player);
    },

    tick: function(keys) {
	if (this.pauseTime > 0) {
	    this.pauseTime--;
	    return;
	}

        var kmap = {
            w: "W".charCodeAt(),
            s: "S".charCodeAt(),
            a: "A".charCodeAt(),
            d: "D".charCodeAt(),
            q: "Q".charCodeAt(),
            e: "E".charCodeAt()
        };

	this.time++;

        var dk = dojo.keys;

	var strafe = keys[dk.CTRL] || keys[dk.ALT] || keys[dk.META] || keys[dk.SHIFT];

	var lk = keys[dk.LEFT_ARROW] || keys[dk.NUMPAD_4];
	var rk = keys[dk.RIGHT_ARROW] || keys[dk.NUMPAD_6];

	var up = keys[kmap.w] || keys[dk.UP_ARROW] || keys[dk.NUMPAD_8];
	var down = keys[kmap.s] || keys[dk.DOWN_ARROW] || keys[dk.NUMPAD_2];

        var left = keys[kmap.a] || (strafe && lk);
	var right = keys[kmap.d] || (strafe && rk);

	var turnLeft = keys[kmap.q] || (!strafe && lk);
	var turnRight = keys[kmap.e] || (!strafe && rk);

	var use = keys[dk.SPACE];

	for (var i = 0; i < 8; i++) {
	    if (keys["1".charCodeAt() + i]) {
		keys["1".charCodeAt() + i] = false;
		this.player.selectedSlot = i;
		this.player.itemUseTime = 0;
	    }
	}

	if (keys[dk.ESCAPE]) {
	    keys[dk.ESCAPE] = false;
	    if (this.menu == null) {
		this.setMenu(new pocjs.menu.PauseMenu());
	    }
	}

	if (use) {
	    keys[dk.SPACE] = false;
	}

	if (this.menu != null) {
	    keys[kmap.w] = keys[dk.UP_ARROW] = keys[dk.NUMPAD_8] = false;
	    keys[kmap.s] = keys[dk.DOWN_ARROW] = keys[dk.NUMPAD_2] = false;
            keys[kmap.a] = false;
            keys[kmap.d] = false;

	    this.menu.tick(this, up, down, left, right, use);
	}
        else {
	    this.player.tick(up, down, left, right, turnLeft, turnRight);
	    if (use) {
		this.player.activate();
            }

	    this.level.tick();
	}
    },

    getLoot: function(item) {
	this.player.addLoot(item);
    },

    win: function(player) {
	this.setMenu(new pocjs.menu.WinMenu(player));
    },

    setMenu: function(menu) {
	this.menu = menu;
    },

    lose: function(player) {
        this.setMenu(new pocjs.menu.LoseMenu(player));
    }
});
