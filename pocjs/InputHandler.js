dojo.provide("pocjs.InputHandler");

dojo.declare("pocjs.InputHandler", null, {
    keys: [],

    keyup: function(evt) {
        this.keys[evt.keyCode] = false;
        // console.log("up keycode: " + evt.keyCode);
        evt.preventDefault();
    },

    keydown: function(evt) {
        this.keys[evt.keyCode] = true;
        evt.preventDefault();
    }
});
