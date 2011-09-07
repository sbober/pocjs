dojo.provide("pocjs.EscapeComponent");


dojo.declare("pocjs.EscapeComponent", null, {
    WIDTH: 160,
    HEIGHT: 120,
    SCALE: 4,
    context: null,
    canvas: null,
    game: null,
    screen: null,
    img: null,
    pixels: null,
    input: null,
    running: false,
    lastTime: null,
    frames: 0,
    inFlight: false,
    resizeArray: null,

    constructor: function(canvas) {
        this.context = canvas.getContext('2d');
        this.canvas = canvas;
        canvas.width = this.WIDTH * this.SCALE;
        canvas.height = this.HEIGHT * this.SCALE;

        var self = this;
        this.dfd = this.loadResources().then(function(res){
            self.game = new pocjs.Game();
            self.screen = new pocjs.gui.Screen(self.WIDTH, self.HEIGHT);

            self.img = self.context.createImageData(canvas.width, canvas.height);
            self.tmpcanvas = document.createElement('canvas');
            self.tmpcanvas.width = self.WIDTH;
            self.tmpcanvas.height = self.HEIGHT;
            self.tmpctx = self.tmpcanvas.getContext('2d');
            self.context.mozImageSmoothingEnabled = false;
//            self.context.scale(self.SCALE, self.SCALE);
            self.tmpimg = self.tmpctx.createImageData(self.WIDTH, self.HEIGHT);
            //self.pixels = self.img.data;

            //self.resizeArray = new Array(canvas.width * canvas.height);
            self.input = new pocjs.InputHandler();

            dojo.connect(document, "onkeyup", self.input, "keyup");
            dojo.connect(document, "onkeydown", self.input, "keydown");
            return("done");
        });


    },

    loadResources: function() {
        var list = [];
        var self = this;
        dojo.byId("status").innerHTML = "Loading resources ...";
        "start crypt ice temple overworld dungeon"
        .split(" ")
        .forEach(function(name) {
            list.push( pocjs.level.Level.loadLevelBitmap(name) );
        });

        "walls floors sprites font panel items sky"
        .split(" ")
        .forEach(function(name) {
            list.push( pocjs.Art.loadBitmap(name, "res/tex/"+name+".png") );
        });

        list.push( pocjs.Art.loadBitmap("logo", "res/gui/logo.png") );

        (   "altar bosskill click1 click2 crumble cut death " +
            "hit hurt2 hurt key kill ladder pickup potion roll " +
            "shoot slide splash thud treasure"
        ).split(" ").forEach(function(name) {
             list.push( pocjs.Sound.loadSound(name) );
        });
        var dfd = new dojo.DeferredList(list).then(function(res){
            dojo.byId("status").innerHTML = "Done.";
            return res;
        });
        this.list = list;
        return dfd;
    },

    start: function() {
        var self = this;
        dojo.create('button', {onclick: 'pocjs.__game.stop();', innerHTML: 'Stop'}, dojo.body());

//        this.run();
        this.dfd.then(function(res) {
            self.running = true;
            self.lastTime = Date.now();
            self.loopHandle = setInterval( function() { self.run() }, 1000/60  );
        });
    },

    stop: function() {
        clearInterval(this.loopHandle);
    },
    run: function() {
        if (this.inFlight) return;
        this.inFlight = true;
        this.tick();
        this.render();

        var passedTime = (Date.now() - this.lastTime)/1000;
        if (passedTime >= 2) {
            var fps = this.frames / passedTime;
            dojo.byId('fps').innerHTML = "" + fps + " FPS";
            this.frames = 0;
            this.lastTime = Date.now();
        }
        this.frames++;
        this.inFlight = false;
    },

    tick: function() {
        this.game.tick(this.input.keys);
    },
    render: function() {
        this.screen.render(this.game);
        var spixels = this.screen.pixels;
        //this.resize(spixels);
        for (var i = 0; i < spixels.length; i++) {
            var pix = spixels[i];
            var off = i*4;
            this.tmpimg.data[off] = (pix >> 16) & 0xff;      // r
            this.tmpimg.data[off+1] = (pix >> 8) & 0xff;     // g
            this.tmpimg.data[off+2] = pix & 0xff;            // b
            this.tmpimg.data[off+3] = 255; //pix >> 24;             // a
        }

        this.tmpctx.putImageData(this.tmpimg, 0, 0);
        this.context.drawImage(this.tmpcanvas, 0, 0, this.WIDTH, this.HEIGHT, 0, 0, this.WIDTH * this.SCALE, this.HEIGHT * this.SCALE);
    },
    resize: function(pixels) {
        var w1 = this.WIDTH;
        var w2 = this.WIDTH * this.SCALE;
        var h1 = this.HEIGHT;
        var h2 = this.HEIGHT * this.SCALE;
        var x_ratio = w1 / w2;
        var y_ratio = h1 / h2;
        var px, py;
        for (var i = 0; i < h2; i++) {
            for (var j = 0; j < w2; j++) {
                px = j*x_ratio >>>0;
                py = i*y_ratio >>>0;
                this.resizeArray[i*w2+j] = pixels[py*w1+px];
            }
        }
    }
});
