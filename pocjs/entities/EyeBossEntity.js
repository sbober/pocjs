dojo.provide("pocjs.entities.EyeBossEntity");

dojo.declare("pocjs.entities.EyeBossEntity", pocjs.entities.EnemyEntity, {


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 4, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 10;
        this.r = 0.3;
        this.runSpeed = 4;
        this.spinSpeed *= 1.5;

        this.flying = true;
    },

    die: function() {
        pocjs.Sound.bosskill.play();
        this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.z));
    }
});
