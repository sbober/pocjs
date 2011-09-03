dojo.provide("pocjs.level.block.DoorBlock");

dojo.declare("pocjs.level.block.DoorBlock", pocjs.level.block.SolidBlock, {
    open: false,
    openness: 0,

    constructor: function() {
            this.tex = 4;
            this.solidRender = false;
    },

    use: function(level, item) {
        this.open = !this.open;
        if (this.open) pocjs.Sound.click1.play();
        else pocjs.Sound.click2.play();
        return true;
    },

    tick: function() {
        this.inherited(arguments);
        
        if (this.open) this.openness += 0.2;
        else this.openness -= 0.2;
        if (this.openness < 0) this.openness = 0;
        if (this.openness > 1) this.openness = 1;

        var openLimit = 7 / 8.0;
        if (this.openness < openLimit && !this.open && !this.blocksMotion) {
            if (this.level.containsBlockingEntity(this.x - 0.5, this.y - 0.5, this.x + 0.5, this.y + 0.5)) {
                this.openness = openLimit;
                return;
            }
        }

        this.blocksMotion = this.openness < openLimit;
    },

    blocks: function(entity) {
        var openLimit = 7 / 8.0;
        var goodClass = "Player Bullet OgreEntity".split(" ").some(function(clazz) {
            return entity instanceof pocjs.entities[clazz];
        });
        if (this.openness >= openLimit && goodClass) return this.blocksMotion;
        
        return true;
    }
});

