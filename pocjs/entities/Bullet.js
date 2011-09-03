dojo.provide("pocjs.entities.Bullet");

dojo.declare("pocjs.entities.Bullet", pocjs.entities.Entity, {
    owner: null,

    constructor: function(owner, x, z, rot, pow, sprite, col) {
        this.r = 0.01;
        this.owner = owner;

        this.xa = Math.sin(rot) * 0.2 * pow;
        this.za = Math.cos(rot) * 0.2 * pow;
        this.x = x - this.za / 2;
        this.z = z + this.xa / 2;

        this.sprites.push(
            new pocjs.gui.Sprite(
                0, 0, 0, 8 * 3 + this.sprite, pocjs.Art.getCol(col)
            )
        );

        this.flying = true;
    },

    tick: function() {
        var xao = this.xa;
        var zao = this.za;
        this.move();

        if ((this.xa == 0 && this.za == 0) || this.xa != xao || this.za != zao) {
            this.remove();
        }
    },

    blocks: function(entity, x2, z2, r2) {
        if (entity instanceof pocjs.entities.Bullet) {
            return false;
        }
        if (entity === this.owner) return false;
        
        return this.inherited(arguments);
    },

    collide: function(entity) {
    }
});

