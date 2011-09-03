dojo.provide("pocjs.entities.EnemyEntity");

dojo.declare("pocjs.entities.EnemyEntity", pocjs.entities.Entity, {

    sprite: null,
    rot: 0,
    rota: 0,
    defaultTex: null,
    defaultColor: null,
    hurtTime:  0,
    animTime:  0,
    health:  3,
    spinSpeed:  0.1,
    runSpeed:  1,

    constructor: function(x, z, defaultTex, defaultColor) {

        this.inherited(arguments);
        this.x = x;
        this.z = z;
        this.defaultColor = defaultColor;
        this.defaultTex = defaultTex;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 4 * 8, defaultColor);
        this.sprites.push(this.sprite);
        this.r = 0.3;
    },

    haveNextGaussian: false,
    nextNextGaussian: null,
    nextGaussian: function() {
        if (this.haveNextNextGaussian) {
            this.haveNextNextGaussian = false;
            return this.nextNextGaussian;
        }
        else {
            var v1, v2, s;
            do {
                v1 = 2 * Math.random() - 1;   // between -1.0 and 1.0
                v2 = 2 * Math.random() - 1;   // between -1.0 and 1.0
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
            var multiplier = Math.sqrt(-2 * Math.log(s)/s);
            this.nextNextGaussian = v2 * multiplier;
            this.haveNextNextGaussian = true;
            return v1 * multiplier;
        }
    },

    tick: function() {
        if (this.hurtTime > 0) {
            this.hurtTime--;
            if (this.hurtTime == 0) {
                this.sprite.col = this.defaultColor;
            }
        }
        this.animTime++;
        this.sprite.tex = this.defaultTex + (this.animTime / 10 <<0) % 2;
        this.move();
        if (this.xa == 0 || this.za == 0) {
            this.rota += (this.nextGaussian() * Math.random()) * 0.3;
        }

        this.rota += (this.nextGaussian() * Math.random()) * this.spinSpeed;
        this.rot += this.rota;
        this.rota *= 0.8;
        this.xa *= 0.8;
        this.za *= 0.8;
        this.xa += Math.sin(this.rot) * 0.004 * this.runSpeed;
        this.za += Math.cos(this.rot) * 0.004 * this.runSpeed;
    },

    use: function(source, item) {
        if (this.hurtTime > 0) return false;
        if (item != pocjs.entities.Item.powerGlove) return false;

        this.hurt(Math.sin(source.rot), Math.cos(source.rot));

        return true;
    },

    hurt: function(xd, zd) {
        this.sprite.col = pocjs.Art.getCol(0xff0000);
        this.hurtTime = 15;

        var dd = Math.sqrt(xd * xd + zd * zd);
        this.xa += xd / dd * 0.2;
        this.za += zd / dd * 0.2;
        pocjs.Sound.hurt2.play();
        this.health--;
        if (this.health <= 0) {
            var xt = (this.x + 0.5) << 0;
            var zt = (this.z + 0.5) << 0;
            this.level.getBlock(xt, zt)
                      .addSprite(new pocjs.gui.PoofSprite(this.x - xt, 0, this.z - zt));
            this.die();
            this.remove();
            pocjs.Sound.kill.play();
        }
    },

    die: function() {

    },

    collide: function(entity) {
        if (entity instanceof pocjs.entities.Bullet) {
            var bullet = entity;
            if (bullet.owner.declaredClass == this.declaredClass) {
                return;
            }
            if (this.hurtTime > 0) return;
            entity.remove();
            this.hurt(entity.xa, entity.za);
        }
        if (entity instanceof pocjs.entities.Player) {
            entity.hurt(this, 1);
        }
    }
});
