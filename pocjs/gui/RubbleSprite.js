dojo.provide("pocjs.gui.RubbleSprite");

dojo.declare("pocjs.gui.RubbleSprite", pocjs.gui.Sprite, {
    xa: null, ya: null, za: null,


    "-chains-": {constructor: "manual"},
    constructor: function() {
        this.inherited(arguments, [ Math.random() - 0.5,
                    Math.random() * 0.8,
                    Math.random() - 0.5,
                    2, 0x555555
        ]);
        this.xa = Math.random() - 0.5;
        this.ya = Math.random();
        this.za = Math.random() - 0.5;
    },

    tick: function() {
        this.x += this.xa * 0.03;
        this.y += this.ya * 0.03;
        this.z += this.za * 0.03;
        this.ya -= 0.1;
        if (this.y < 0) {
            this.y = 0;
            this.xa *= 0.8;
            this.za *= 0.8;
            if (Math.random() < 0.04)
                this.removed = true;
        }
    }
});

