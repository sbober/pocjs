dojo.provide("pocjs.entities.KeyEntity");

dojo.declare("pocjs.entities.KeyEntity", pocjs.entities.Entity, {
    COLOR: pocjs.Art.getCol(0x00ffff),
    sprite:  null,
    y: null, ya: null,

    constructor: function(x, z) {
        this.x = x;
        this.z = z;
        this.y = 0.5;
        this.ya = 0.025;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 16 + 3, this.COLOR);
        this.sprites.push(this.sprite);
    },

    tick: function() {
        this.move();
        this.y += this.ya;
        if (this.y < 0) this.y = 0;
        this.ya -= 0.005;
        this.sprite.y = this.y;
    },

    collide: function(entity) {
        if (entity instanceof pocjs.entities.Player) {
            pocjs.Sound.key.play();
            entity.keys++;
            this.remove();
        }
    }
});
