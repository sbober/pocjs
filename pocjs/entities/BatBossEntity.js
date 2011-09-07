dojo.provide("pocjs.entities.BatBossEntity");

dojo.declare("pocjs.entities.BatBossEntity", pocjs.entities.EnemyEntity, {

    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 5;
        this.r = 0.3;
        
        this.flying = true;
    },

    die: function() {
        pocjs.Sound.bosskill.play();
        this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.z));
    },

    tick: function() {
        this.inherited(arguments);
        if (Math.random() * 20 < 1) {
            var xx = this.x + (Math.random() - 0.5) * 2;
            var zz = this.z + (Math.random() - 0.5) * 2;
            var batEntity = new pocjs.entities.BatEntity(xx, zz);
            batEntity.level = this.level;

            if (batEntity.isFree(xx, zz)) {
                this.level.addEntity(batEntity);
            }
        }
    }
});

