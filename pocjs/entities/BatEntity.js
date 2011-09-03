dojo.provide("pocjs.entities.BatEntity");

dojo.declare("pocjs.entities.BatEntity", pocjs.entities.EnemyEntity, {

    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8, pocjs.Art.getCol(0x82666E)]);
        this.x = x;
        this.z = z;
        this.health = 2;
        this.r = 0.3;
        
        this.flying = true;
    }
});

