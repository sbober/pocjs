dojo.provide("pocjs.gui.Bitmap");

dojo.declare("pocjs.gui.Bitmap", null, {

    width: null,
    height: null,
    pixels: null,

    statics: {
        chars:  "" +
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?\"'/\\<>()[]{}" +
		"abcdefghijklmnopqrstuvwxyz_               " +
		"0123456789+-=*:;÷≈ƒÂ                      " +
		""
    },

    constructor: function(width, height) {
        this.width = width;
        this.height = height;
        this.pixels = new Array(width * height);

    },

    draw: function(bitmap, xOffs, yOffs) {
        xOffs <<= 0; yOffs <<= 0;

	for (var y = 0; y < bitmap.height; y++) {
            var yPix = y + yOffs;
	    if (yPix < 0 || yPix >= this.height) continue;

	    for (var x = 0; x < bitmap.width; x++) {
		var xPix = x + xOffs;
		if (xPix < 0 || xPix >= this.width) continue;

		var src = bitmap.pixels[x + y * bitmap.width];
		this.pixels[xPix + yPix * this.width] = src;
	    }
	}
    },

    flipDraw: function(bitmap, xOffs, yOffs) {
        xOffs <<= 0; yOffs <<= 0;

	for (var y = 0; y < bitmap.height; y++) {
            var yPix = y + yOffs;
	    if (yPix < 0 || yPix >= this.height) continue;

	    for (var x = 0; x < bitmap.width; x++) {
		var xPix = xOffs + bitmap.width - x - 1;
		if (xPix < 0 || xPix >= this.width) continue;

		var src = bitmap.pixels[x + y * bitmap.width];
		this.pixels[xPix + yPix * this.width] = src;
	    }
	}
    },

    drawPart: function(bitmap, xOffs, yOffs, xo, yo, w, h, col) {
        xOffs <<= 0; yOffs <<= 0; xo <<= 0; yo <<= 0; w <<= 0; h <<= 0;

	for (var y = 0; y < h; y++) {
            var yPix = y + yOffs;
	    if (yPix < 0 || yPix >= this.height) continue;

	    for (var x = 0; x < w; x++) {
		var xPix = x + xOffs;
		if (xPix < 0 || xPix >= this.width) continue;

		var src = bitmap.pixels[(x + xo) + (y + yo) * bitmap.width];
		if (src >= 0) {
		    this.pixels[xPix + yPix * this.width] = src * col;
		}
	    }
	}
    },

    scalecount: 0,
    scaleDraw: function(bitmap, scale, xOffs, yOffs, xo, yo, w, h, col) {
	for (var y = 0; y < h * scale; y++) {
	    var yPix = y + yOffs;
	    if (yPix < 0 || yPix >= this.height) continue;

	    for (var x = 0; x < w * scale; x++) {
		var xPix = x + xOffs;
		if (xPix < 0 || xPix >= this.width) continue;

		var src = bitmap.pixels[((x / scale <<0) + xo) + ((y / scale <<0) + yo) * bitmap.width ];
		if (src >= 0) {
		    this.pixels[xPix + yPix * this.width] = src * col;
		}
	    }
	}
    },

    drawString: function(string, x, y, col) {
        x <<= 0;
        y <<= 0;

	for (var i = 0; i < string.length; i++) {
	    var ch = this.statics.chars.indexOf( string[i] );
	    if (ch < 0) continue;

	    var xx = ch % 42;
	    var yy = ch / 42 << 0;
	    this.drawPart(pocjs.Art.font, x + i * 6, y, xx * 6, yy * 8, 5, 8, col);
	}
    },
	
    fill: function(x0, y0, x1, y1, color) {
        x0 <<= 0; y0 <<= 0; x1 <<= 0; y1 <<= 0;

	for (var y = y0; y < y1; y++) {
	    for (var x = x0; x < x1; x++) {
		this.pixels[x + y * this.width] = color;
	    }
	}
    }
	
});

