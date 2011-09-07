dojo.provide("pocjs.entities.Player");

dojo.declare("pocjs.entities.Player", pocjs.entities.Entity, {
    bob: null, bobPhase: null, turnBob: null,
    selectedSlot: 0,
    itemUseTime: 0,
    y: null, ya: null,
    hurtTime: 0,
    health: 20,
    keys: 0,
    loot: 0,
    dead: false,
    deadTime: 0,
    ammo: 0,
    potions: 0,
    lastBlock: null,

    items: null,

    constructor: function() {
        this.r = 0.3;
        this.items = new Array(8);
        for (var i = 0; i < this.items.length; i++) {
            this.items[i] = pocjs.entities.Item.none;
        }
    },

    sliding: false,
    time: null,

    tick: function(up, down, left, right, turnLeft, turnRight) {
        if (this.dead) {
            up = down = left = right = turnLeft = turnRight = false;
            this.deadTime++;
            if (this.deadTime > 60 * 2) {
                this.level.lose();
            }
        }
        else {
            this.time++;
        }

        if (this.itemUseTime > 0) this.itemUseTime--;
        if (this.hurtTime > 0) this.hurtTime--;

        var onBlock = this.level.getBlock((this.x + 0.5) << 0, (this.z + 0.5) << 0);

        var fh = onBlock.getFloorHeight(this);
        if (onBlock instanceof pocjs.level.block.WaterBlock
                && !(this.lastBlock instanceof pocjs.level.block.WaterBlock)) {
            pocjs.Sound.splash.play();
        }

        this.lastBlock = onBlock;

        if (this.dead) fh = -0.6;
        if (fh > this.y) {
            this.y += (fh - this.y) * 0.2;
            this.ya = 0;
        } else {
            this.ya -= 0.01;
            this.y += this.ya;
            if (this.y < fh) {
                this.y = fh;
                this.ya = 0;
            }
        }

        var rotSpeed = 0.05;
        var walkSpeed = 0.03 * onBlock.getWalkSpeed(this);

        if (turnLeft) this.rota += rotSpeed;
        if (turnRight) this.rota -= rotSpeed;

        var xm = 0;
        var zm = 0;
        if (up) zm--;
        if (down) zm++;
        if (left) xm--;
        if (right) xm++;
        var dd = xm * xm + zm * zm;
        if (dd > 0) dd = Math.sqrt(dd);
        else dd = 1;
        xm /= dd;
        zm /= dd;

        this.bob *= 0.6;
        this.turnBob *= 0.8;
        this.turnBob += this.rota;
        this.bob += Math.sqrt(xm * xm + zm * zm);
        this.bobPhase += Math.sqrt(xm * xm + zm * zm) * onBlock.getWalkSpeed(this);
        var wasSliding = this.sliding;
        this.sliding = false;

        if (onBlock instanceof pocjs.level.block.IceBlock
                && this.getSelectedItem() != pocjs.entities.Item.skates) {
            if (this.xa * this.xa > this.za * this.za) {
                this.sliding = true;
                this.za = 0;
                if (this.xa > 0) this.xa = 0.08;
                else this.xa = -0.08;
                this.z += ( Math.floor(this.z + 0.5) - this.z) * 0.2;
            }
            else if (this.xa * this.xa < this.za * this.za) {
                this.sliding = true;
                this.xa = 0;
                if (this.za > 0) this.za = 0.08;
                else this.za = -0.08;
                this.x += ( Math.floor(this.x + 0.5) - this.x) * 0.2;
            }
            else {
                this.xa -= (xm * Math.cos(this.rot) + zm * Math.sin(this.rot)) * 0.1;
                this.za -= (zm * Math.cos(this.rot) - xm * Math.sin(this.rot)) * 0.1;
            }

            if (!wasSliding && this.sliding) {
                pocjs.Sound.slide.play();
            }
        }
        else {
            this.xa -= (xm * Math.cos(this.rot) + zm * Math.sin(this.rot)) * walkSpeed;
            this.za -= (zm * Math.cos(this.rot) - xm * Math.sin(this.rot)) * walkSpeed;
        }

        this.move();

        var friction = onBlock.getFriction(this);
        this.xa *= friction;
        this.za *= friction;
        this.rot += this.rota;
        this.rota *= 0.4;
    },

    activate: function() {
        if (this.dead) return;
        if (this.itemUseTime > 0) return;
        var item = this.items[this.selectedSlot];
        if (item == pocjs.entities.Item.pistol) {
            if (this.ammo > 0) {
                pocjs.Sound.shoot.play();
                this.itemUseTime = 10;
                this.level.addEntity(
                    new pocjs.entities.Bullet(
                        this, this.x, this.z, this.rot, 1, 0, 0xffffff));
                this.ammo--;
            }
            return;
        }
        if (item == pocjs.entities.Item.potion) {
            if (this.potions > 0 && this.health < 20) {
                pocjs.Sound.potion.play();
                this.itemUseTime = 20;
                this.health += 5 + (Math.random() * 6 << 0);
                if (this.health > 20) this.health = 20;
                this.potions--;
            }
            return;
        }
        if (item == pocjs.entities.Item.key) this.itemUseTime = 10;
        if (item == pocjs.entities.Item.powerGlove) this.itemUseTime = 10;
        if (item == pocjs.entities.Item.cutters) this.itemUseTime = 10;

        var xa = (2 * Math.sin(this.rot));
        var za = (2 * Math.cos(this.rot));

        var rr = 3;
        var xc = (this.x + 0.5) << 0;
        var zc = (this.z + 0.5) << 0;
        var possibleHits = [];
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.level.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (e == this) continue;
                    possibleHits.push(e);
                }
            }
        }

        var divs = 100;
        for (var i = 0; i < divs; i++) {
            var xx = this.x + xa * i / divs;
            var zz = this.z + za * i / divs;
            for (var j = 0; j < possibleHits.length; j++) {
                var e = possibleHits[j];
                if (e.contains(xx, zz)) {
                    if (e.use(this, this.items[this.selectedSlot])) {
                        return;
                    }
                }

            }
            if (this.level.getBlock( (xx + 0.5) << 0, (zz + 0.5) << 0)
                          .use( this.level, this.items[this.selectedSlot])) {
                return;
            }
        }
    },

    blocks: function(entity, x2, z2, r2) {
        if (entity instanceof pocjs.entities.Bullet) return false;
        return this.inherited(arguments);
    },

    getSelectedItem: function() {
        return this.items[this.selectedSlot];
    },

    addLoot: function(item) {
        if (item == pocjs.entities.Item.pistol) this.ammo += 20;
        if (item == pocjs.entities.Item.potion) this.potions += 1;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] == item) {
                this.level.showLootScreen(item);
                return;
            }
        }

        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] == pocjs.entities.Item.none) {
                this.items[i] = item;
                this.selectedSlot = i;
                this.itemUseTime = 0;
                this.level.showLootScreen(item);
                return;
            }
        }
    },

    hurt: function(enemy, dmg) {
        if (this.hurtTime > 0 || this.dead) return;

        this.hurtTime = 40;
        this.health -= dmg;

        if (this.health <= 0) {
            this.health = 0;
            pocjs.Sound.death.play();
            this.dead = true;
        }

        pocjs.Sound.hurt.play();

        var xd = enemy.x - this.x;
        var zd = enemy.z - this.z;
        var dd = Math.sqrt(xd * xd + zd * zd);
        this.xa -= xd / dd * 0.1;
        this.za -= zd / dd * 0.1;
        this.rota += (Math.random() - 0.5) * 0.2;
    },

    collide: function(entity) {
        if (entity instanceof pocjs.entities.Bullet) {
            var bullet = entity;
            if (bullet.owner.declaredClass == this.declaredClass) {
                return;
            }
            if (this.hurtTime > 0) return;
            entity.remove();
            this.hurt(entity, 1);
        }
    },

    win: function() {
        this.level.win();
    }
});
