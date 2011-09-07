dojo.provide("pocjs.entities.GhostBossEntity");

dojo.declare("pocjs.entities.GhostBossEntity", pocjs.entities.EnemyEntity, {
    rotatePos: 0,
    shootDelay: 0,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 6, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 10;
        this.flying = true;
    },

    tick: function() {
        this.animTime++;
        this.sprite.tex = this.defaultTex + (this.animTime / 10 | 0 ) % 2;

        var xd = (this.level.player.x + Math.sin(this.rotatePos) * 2) - this.x;
        var zd = (this.level.player.z + Math.cos(this.rotatePos) * 2) - this.z;
        var dd = xd * xd + zd * zd;

        if (dd < 1) {
            this.rotatePos += 0.04;
        } else {
            this.rotatePos = this.level.player.rot;
        }
        if (dd < 4 * 4) {
            dd = Math.sqrt(dd);

            xd /= dd;
            zd /= dd;

            this.xa += xd * 0.006;
            this.za += zd * 0.006;
            
            if (this.shootDelay > 0) this.shootDelay--;
            else if ((Math.random() * 10 | 0) == 0) {
                this.shootDelay = 10;
                this.level.addEntity(
                    new pocjs.entities.Bullet(
                        this, this.x, this.z,
                        Math.atan2( this.level.player.x - this.x, this.level.player.z - this.z),
                        0.20, 1, this.defaultColor));
            }

        }

        this.move();

        this.xa *= 0.9;
        this.za *= 0.9;
    },

    hurt: function(xd, zd) {
    },

    move: function() {
        this.x += this.xa;
        this.z += this.za;
    }
});

