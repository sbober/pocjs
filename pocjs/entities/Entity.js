dojo.provide("pocjs.entities.Entity");


dojo.declare("pocjs.entities.Entity", null, {

    sprites: null,

    x: 0, z: 0, rot: 0,
    xa: 0, za: 0,  rota: 0,
    r: 0.4,

    level: null,
    xTileO: -1,
    zTileO: -1,
    flying: false,

    removed: false,

    //constructor: function(a, b, c, d) {
    constructor: function(x, z, defaultTex, defaultColor) {
        this.sprites = [];
    },
    updatePos: function() {
        var xTile = (this.x + 0.5) << 0;
        var zTile = (this.z + 0.5) << 0;
        if (xTile != this.xTileO || zTile != this.zTileO) {
            this.level.getBlock(this.xTileO, this.zTileO).removeEntity(this);

            this.xTileO = xTile;
            this.zTileO = zTile;

            if (!this.removed) this.level.getBlock(this.xTileO, this.zTileO).addEntity(this);
        }
    },

    isRemoved: function() {
        return this.removed;
    },

    remove: function() {
        this.level.getBlock(this.xTileO, this.zTileO).removeEntity(this);
        this.removed = true;
    },

    move: function() {

        var xSteps = (Math.abs(this.xa * 100) + 1) << 0;
        for (var i = xSteps; i > 0; i--) {
            var xxa = this.xa;
            if (this.isFree(this.x + xxa * i / xSteps, this.z)) {
                this.x += xxa * i / xSteps;
                break;
            } else {
                this.xa = 0;
            }
        }

        var zSteps = (Math.abs(this.za * 100) + 1) << 0;
        for (var i = zSteps; i > 0; i--) {
            var zza = this.za;
            if (this.isFree(this.x, this.z + zza * i / zSteps)) {
                this.z += zza * i / zSteps;
                break;
            } else {
                this.za = 0;
            }
        }
    },

    isFree: function(xx, yy) {
        var x0 = (Math.floor(xx + 0.5 - this.r)) << 0;
        var x1 = (Math.floor(xx + 0.5 + this.r)) << 0;
        var y0 = (Math.floor(yy + 0.5 - this.r)) << 0;
        var y1 = (Math.floor(yy + 0.5 + this.r)) << 0;


        if (this.level.getBlock(x0, y0).blocks(this)) return false;
        if (this.level.getBlock(x1, y0).blocks(this)) return false;
        if (this.level.getBlock(x0, y1).blocks(this)) return false;
        if (this.level.getBlock(x1, y1).blocks(this)) return false;

        var xc = (Math.floor(xx + 0.5)) << 0;
        var zc = (Math.floor(yy + 0.5)) << 0;
        var rr = 2;
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.level.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (e == this) continue;

                    if (e.blocks(this, xx, yy, this.r)) {
                        e.collide(this);
                        this.collide(e);
                        return false;
                    }
                }
            }
        }
        return true;
    },

    collide: function(entity) {
    },

    blocks: function(entity, x2, z2, r2) {
        if (entity instanceof pocjs.entities.Bullet) {
            if (entity.owner == this) return false;
        }
        if (this.x + this.r <= x2 - r2) return false;
        if (this.x - this.r >= x2 + r2) return false;

        if (this.z + this.r <= z2 - r2) return false;
        if (this.z - this.r >= z2 + r2) return false;

        return true;
    },

    contains: function(x2, z2) {
        if (this.x + this.r <= x2) return false;
        if (this.x - this.r >= x2) return false;

        if (this.z + this.r <= z2) return false;
        if (this.z - this.r >= z2) return false;

        return true;
    },

    isInside: function(x0, z0, x1, z1) {
        if (this.x + this.r <= x0) return false;
        if (this.x - this.r >= x1) return false;

        if (this.z + this.r <= z0) return false;
        if (this.z - this.r >= z1) return false;

        return true;
    },

    use: function(source, item) {
        return false;
    },

    tick: function() {
    }
});

