dojo.provide("pocjs.entities.GhostEntity");

dojo.declare("pocjs.entities.GhostEntity", pocjs.entities.EnemyEntity, {
    rotatePos: 0,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 6, pocjs.Art.getCol(0xffffff)]);
        this.x = x;
        this.z = z;
        this.health = 4;
        this.r = 0.3;

        this.flying = true;
    },

    tick: function() {
        this.animTime++;
        this.sprite.tex = this.defaultTex + (this.animTime / 10 << 0) % 2;

        var xd = (this.level.player.x + Math.sin(this.rotatePos)) - this.x;
        var zd = (this.level.player.z + Math.cos(this.rotatePos)) - this.z;
        var dd = xd * xd + zd * zd;

        if (dd < 4 * 4) {
            if (dd < 1) {
                this.rotatePos += 0.04;
            } else {
                this.rotatePos = this.level.player.rot;
                this.xa += (Math.random() - 0.5) * 0.02;
                this.za += (Math.random() - 0.5) * 0.02;
            }
            
            dd = Math.sqrt(dd);

            xd /= dd;
            zd /= dd;

            this.xa += xd * 0.004;
            this.za += zd * 0.004;
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
