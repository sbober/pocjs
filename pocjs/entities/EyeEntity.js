dojo.provide("pocjs.entities.EyeEntity");

dojo.declare("pocjs.entities.EyeEntity", pocjs.entities.EnemyEntity, {

    "-chains-": {constructor: "manual"},

    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8+4, pocjs.Art.getCol(0x84ECFF)]);
        this.x = x;
        this.z = z;
        this.health = 4;
        this.r = 0.3;
        this.runSpeed = 2;
        this.spinSpeed *= 1.5;
        
        this.flying = true;
    }
});
