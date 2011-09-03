dojo.provide("pocjs.entities.BoulderEntity");

dojo.declare("pocjs.entities.BoulderEntity", pocjs.entities.Entity, {
    COLOR: pocjs.Art.getCol(0xAFA293),
    sprite: null,
    rollDist: 0,

    constructor: function(x, z) {
        this.x = x;
        this.z = z;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 16, this.COLOR);
        this.sprites.push(this.sprite);
    },

    tick: function() {
        this.rollDist += Math.sqrt(this.xa * this.xa + this.za * this.za);
        this.sprite.tex = 8 + ((this.rollDist * 4) & 1);
        var xao = this.xa;
        var zao = this.za;
        this.move();
        if (this.xa == 0 && xao != 0) this.xa = -xao * 0.3;
        if (this.za == 0 && zao != 0) this.za = -zao * 0.3;
        this.xa *= 0.98;
        this.za *= 0.98;
        if (this.xa * this.xa + this.za * this.za < 0.0001) {
            this.xa = this.za = 0;
        }
    },

    use: function(source, item) {
        if (item != pocjs.entities.Item.powerGlove) return false;
        pocjs.Sound.roll.play();

        this.xa += Math.sin(source.rot) * 0.1;
        this.za += Math.cos(source.rot) * 0.1;
        return true;
    }
});
