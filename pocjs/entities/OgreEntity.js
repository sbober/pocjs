dojo.provide("pocjs.entities.OgreEntity");

dojo.declare("pocjs.entities.OgreEntity", pocjs.entities.EnemyEntity, {

    shootDelay: null,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 2, pocjs.Art.getCol(0x82A821)]);
        this.x = x;
        this.z = z;
        this.health = 6;
        this.r = 0.4;
        this.spinSpeed = 0.05;
    },

    hurt: function(xd, zd) {
        this.inherited(arguments);
        this.shootDelay = 50;
    },

    tick: function() {
        this.inherited(arguments);
        if (this.shootDelay > 0) this.shootDelay--;
        else if ((Math.random() * 40 << 0) == 0) {
            this.shootDelay = 40;
            this.level.addEntity(
                new pocjs.entities.Bullet(
                    this, this.x, this.z, 
                    Math.atan2(
                        this.level.player.x - this.x, this.level.player.z - this.z
                    ),
                    0.3, 1, this.defaultColor));
        }
    }
});
