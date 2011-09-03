dojo.provide("pocjs.Art");

dojo.declare("pocjs.Art", null, {
});

pocjs.Art.loadBitmap = function(name, filename) {
    var self = this;

    var dfd = new dojo.Deferred();

    PNG.load(filename, function(png) {
        var w = png.width;
        var h = png.height;
        var pixels = new Array(w * h << 0);
        var ppix = png.decodePixels();

        var result = new pocjs.gui.Bitmap(w, h);
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var data = ppix[y][x];

                var input = data[3] << 24
                          | data[0] << 16
                          | data[1] << 8
                          | data[2];
                var col = (input & 0xf) >> 2;
                if (input == (0xffff00ff << 0)) { col = -1; }
                result.pixels[x + y*w] = col;
                pixels[x + y*w] = input;
            }
        }

        self[name] = result;
        dfd.resolve(name);
    });
    return dfd;
}
    

pocjs.Art.getCol = function(c) {
    var r = (c >> 16) & 0xff;
    var g = (c >> 8) & 0xff;
    var b = (c) & 0xff;

    r = r * 0x55 / 0xff;
    g = g * 0x55 / 0xff;
    b = b * 0x55 / 0xff;

    return r << 16 | g << 8 | b;
};

