dojo.provide("pocjs.level.block.Block");


dojo.declare("pocjs.level.block.Block", null, {

    blocksMotion: false,
    solidRender: false,

    messages: null,

    sprites: null,
    entities: null,

    tex: -1,
    col: -1,

    floorCol: -1,
    ceilCol: -1,

    floorTex: -1,
    ceilTex: -1,
    
    level: null,
    x: 0, y: 0,

    id: 0,

    constructor: function() {
        this.messages = [];
        this.sprites = [];
        this.entities = [];
    },

    addSprite: function(sprite) {
        this.sprites.push(sprite);
    },

    use: function(level, item) {
        return false;
    },

    tick: function() {
        this.sprites = this.sprites.filter(function(sprite) {
            sprite.tick();
            if (sprite.removed) return false;
            else return true;
        });
    },

    removeEntity: function(entity) {
        var index = this.entities.indexOf(entity);
        this.entities.splice(index, 1);
    },

    addEntity: function(entity) {
        this.entities.push(entity);
    },

    blocks: function(entity) {
        return this.blocksMotion;
    },

    decorate: function(level, x, y) {
    },

    getFloorHeight: function(e) {
        return 0;
    },

    getWalkSpeed: function(player) {
        return 1;
    },

    getFriction: function(player) {
        return 0.6;
    },

    trigger: function(pressed) {
    }
});


