dojo.provide("pocjs.level.block.PressurePlateBlock");

dojo.declare("pocjs.level.block.PressurePlateBlock", pocjs.level.block.Block, {
    pressed: false,

    constructor: function() {
        this.floorTex = 2;
    },

    tick: function() {
        this.inherited(arguments);
        var r = 0.2;
        var steppedOn = this.level.containsBlockingNonFlyingEntity(
            this.x - r, this.y - r, this.x + r, this.y + r
        );
        if (steppedOn != this.pressed) {
            this.pressed = steppedOn;
            if (this.pressed) this.floorTex = 3;
            else this.floorTex = 2;

            this.level.trigger(this.id, this.pressed);
            if (this.pressed)
                pocjs.Sound.click1.play();
            else
                pocjs.Sound.click2.play();
        }
    },

    getFloorHeight: function(e) {
        if (this.pressed) return -0.02;
        else return 0.02;
    }
});

