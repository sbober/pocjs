dojo.provide("pocjs.entities.BossOgre");

dojo.declare("pocjs.entities.BossOgre", pocjs.entities.EnemyEntity, {

    shootDelay: null,
    shootPhase: null,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 2, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 10;
        this.r = 0.4;
        this.spinSpeed = 0.05;
    },

    die: function() {
        pocjs.Sound.bosskill.play();
        this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.z));
    },

    tick: function() {
        this.inherited(arguments);
        if (this.shootDelay > 0) this.shootDelay--;
        else {
            this.shootDelay = 5;
            var salva = 10;

            for (var i = 0; i < 4; i++) {
                var rot = Math.PI / 2 * (i + this.shootPhase / salva % 2 * 0.5);
                this.level.addEntity(
                        new pocjs.entities.Bullet(
                            this, this.x, this.z, rot, 0.4, 1, this.defaultColor
                        ));
            }

            this.shootPhase++;
            if (this.shootPhase % salva == 0) this.shootDelay = 40;
        }
    }

});

