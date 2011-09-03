dojo.provide("pocjs.gui.Bitmap3D");

dojo.declare("pocjs.gui.Bitmap3D", pocjs.gui.Bitmap, {
    zBuffer: null, 
    zBufferWall: null,
    xCam: 0, yCam: 0, zCam: 0,
    rCos: 0, rSin: 0, fov: 0,
    xCenter: 0, yCenter: 0, rot: 0,


    "-chains-": {constructor: "manual"},
    constructor: function(width, height) {
	this.inherited(arguments);
        this.zBuffer = new Array(width * height);
	this.zBufferWall = new Array(width);
    },

    render: function(game) {
	for (var x = 0; x < this.width; x++) {
	    this.zBufferWall[x] = 0;
	}
	for (var i = 0; i < this.width * this.height; i++) {
	    this.zBuffer[i] = 10000;
        }
	this.rot = game.player.rot;
	this.xCam = game.player.x - Math.sin(this.rot) * 0.3;
	this.yCam = game.player.z - Math.cos(this.rot) * 0.3;
	this.zCam = -0.2 + Math.sin(game.player.bobPhase * 0.4) * 0.01 * game.player.bob - game.player.y;

	this.xCenter = this.width / 2.0;
	this.yCenter = this.height / 3.0;

	this.rCos = Math.cos(this.rot);
	this.rSin = Math.sin(this.rot);

	this.fov = this.height;

	var level = game.level;
	var i_r = 6;

	var i_xCenter = Math.floor(this.xCam);
	var i_zCenter = Math.floor(this.yCam);
	for (var zb = i_zCenter - i_r; zb <= i_zCenter + i_r; zb++) {
	    for (var xb = i_xCenter - i_r; xb <= i_xCenter + i_r; xb++) {
		var c = level.getBlock(xb, zb);
		var e = level.getBlock(xb + 1, zb);
		var s = level.getBlock(xb, zb + 1);

		if (c instanceof pocjs.level.block.DoorBlock) {
		    var rr = 1 / 8.0;
		    var openness = 1 - c.openness * 7 / 8;
		    if (e.solidRender) {
			this.renderWall(xb + openness, zb + 0.5 - rr,
                                        xb, zb + 0.5 - rr,
                                        c.tex,
                                        (c.col & 0xfefefe) >> 1,
                                        0, openness);
			this.renderWall(xb, zb + 0.5 + rr,
                                        xb + openness, zb + 0.5 + rr,
                                        c.tex,
                                        (c.col & 0xfefefe) >> 1,
                                        openness, 0);
			this.renderWall(xb + openness, zb + 0.5 + rr,
                                        xb + openness, zb + 0.5 - rr,
                                        c.tex,
                                        c.col,
                                        0.5 - rr, 0.5 + rr);
		    }
                    else {
			this.renderWall(xb + 0.5 - rr, zb,
                                        xb + 0.5 - rr, zb + openness,
                                        c.tex,
                                        c.col,
                                        openness, 0);
			this.renderWall(xb + 0.5 + rr, zb + openness,
                                        xb + 0.5 + rr, zb,
                                        c.tex,
                                        c.col,
                                        0, openness);
			this.renderWall(xb + 0.5 - rr, zb + openness,
                                        xb + 0.5 + rr, zb + openness,
                                        c.tex,
                                        (c.col & 0xfefefe) >> 1,
                                        0.5 - rr, 0.5 + rr);
		    }

		}

		if (c.solidRender) {
		    if (!e.solidRender) {
			this.renderWall(xb + 1, zb + 1, xb + 1, zb, c.tex, c.col);
		    }
		    if (!s.solidRender) {
			this.renderWall(xb, zb + 1, 
                                        xb + 1, zb + 1,
                                        c.tex,
                                        (c.col & 0xfefefe) >> 1);
		    }
		}
                else {
		    if (e.solidRender) {
			this.renderWall(xb + 1, zb, xb + 1, zb + 1, e.tex, e.col);
		    }
		    if (s.solidRender) {
			this.renderWall(xb + 1, zb + 1,
                                        xb, zb + 1,
                                        s.tex,
                                        (s.col & 0xfefefe) >> 1);
                    }
		}
	    }
	}
	for (var zb = i_zCenter - i_r; zb <= i_zCenter + i_r; zb++) {
	    for (var xb = i_xCenter - i_r; xb <= i_xCenter + i_r; xb++) {
		var c = level.getBlock(xb, zb);

		for (var j = 0; j < c.entities.length; j++) {
		    var e = c.entities[j];
		    for (var i = 0; i < e.sprites.length; i++) {
			var sprite = e.sprites[i];
			this.renderSprite(e.x + sprite.x, 0 - sprite.y, e.z + sprite.z,
                                          sprite.tex, sprite.col);
		    }
		}

		for (var i = 0; i < c.sprites.length; i++) {
		    var sprite = c.sprites[i];
			this.renderSprite(xb + sprite.x, 0 - sprite.y, zb + sprite.z,
                                          sprite.tex, sprite.col);
		}
	    }
	}

	this.renderFloor(level);
    },

    renderFloor: function(level) {
	for (var y = 0; y < this.height; y++) {
	    var yd = ((y + 0.5) - this.yCenter) / this.fov;

	    var floor = true;
	    var zd = (4 - this.zCam * 8) / yd;
	    if (yd < 0) {
		floor = false;
		zd = (4 + this.zCam * 8) / -yd;
	    }

            var fpixels = pocjs.Art.floors.pixels;
	    for (var x = 0; x < this.width; x++) {
		if (this.zBuffer[x + y * this.width] <= zd) continue;

		var xd = (this.xCenter - x) / this.fov;
		xd *= zd;

		var xx = xd * this.rCos + zd * this.rSin + (this.xCam + 0.5) * 8;
                var yy = zd * this.rCos - xd * this.rSin + (this.yCam + 0.5) * 8;

                var i_xPix = xx * 2 <<0;
		var i_yPix = yy * 2 <<0;
		var xTile = i_xPix >> 4;
		var yTile = i_yPix >> 4;

                var block = level.getBlock(xTile, yTile);
		var col = block.floorCol;
		var tex = block.floorTex;
		if (!floor) {
		    col = block.ceilCol;
		    tex = block.ceilTex;
		}

		if (tex < 0) {
                    this.zBuffer[x + y * this.width] = -1;
                }
                else {
                    this.zBuffer[x + y * this.width] = zd;
                    this.pixels[x + y * this.width] = fpixels[((i_xPix & 15) + (tex % 8) * 16) + ((i_yPix & 15) + (tex / 8 <<0) * 16) * 128] * col;
		}
	    }
	}

    },

    renderSprite: function(x, y, z, tex, color) {
	var xc = (x - this.xCam) * 2 - this.rSin * 0.2;
        var yc = (y - this.zCam) * 2;
	var zc = (z - this.yCam) * 2 - this.rCos * 0.2;

        var xx = xc * this.rCos - zc * this.rSin;
	var yy = yc;
	var zz = zc * this.rCos + xc * this.rSin;

	if (zz < 0.1) return;

	var xPixel = this.xCenter - (xx / zz * this.fov);
	var yPixel = (yy / zz * this.fov + this.yCenter);

        var xPixel0 = xPixel - this.height / zz;
	var xPixel1 = xPixel + this.height / zz;

        var yPixel0 = yPixel - this.height / zz;
        var yPixel1 = yPixel + this.height / zz;

        var i_xp0 = Math.ceil(xPixel0);
        var i_xp1 = Math.ceil(xPixel1);
        var i_yp0 = Math.ceil(yPixel0);
        var i_yp1 = Math.ceil(yPixel1);

        if (i_xp0 < 0) i_xp0 = 0;
        if (i_xp1 > this.width) i_xp1 = this.width;
        if (i_yp0 < 0) i_yp0 = 0;
        if (i_yp1 > this.height) i_yp1 = this.height;
        zz *= 4;
        for (var yp = i_yp0; yp < i_yp1; yp++) {
            var ypr = (yp - yPixel0) / (yPixel1 - yPixel0);
            var i_yt = ypr * 16 <<0;
            for (var xp = i_xp0; xp < i_xp1; xp++) {
                var xpr = (xp - xPixel0) / (xPixel1 - xPixel0);
                var i_xt = xpr * 16 <<0;
                if (this.zBuffer[xp + yp * this.width] > zz) {
                    var offset = (i_xt + tex % 8 * 16) + (i_yt + (tex / 8 <<0) * 16) * 128;
                    var col = pocjs.Art.sprites.pixels[offset];
                    if (col >= 0) {
                        this.pixels[xp + yp * this.width] = col * color;
                        this.zBuffer[xp + yp * this.width] = zz;
                    }
                }
            }
        }

    },

    renderWall: function(x0, y0, x1, y1, tex, color, xt0, xt1) {
        if (xt0 === undefined) xt0 = 0;
        if (xt1 === undefined) xt1 = 1;

        var xc0 = ((x0 - 0.5) - this.xCam) * 2;
        var yc0 = ((y0 - 0.5) - this.yCam) * 2;

        var xx0 = xc0 * this.rCos - yc0 * this.rSin;
        var u0 = ((-0.5) - this.zCam) * 2;
        var l0 = ((+0.5) - this.zCam) * 2;
        var zz0 = yc0 * this.rCos + xc0 * this.rSin;

        var xc1 = ((x1 - 0.5) - this.xCam) * 2;
        var yc1 = ((y1 - 0.5) - this.yCam) * 2;

        var xx1 = xc1 * this.rCos - yc1 * this.rSin;
        var u1 = ((-0.5) - this.zCam) * 2;
        var l1 = ((+0.5) - this.zCam) * 2;
        var zz1 = yc1 * this.rCos + xc1 * this.rSin;

        xt0 *= 16;
        xt1 *= 16;

        var zClip = 0.2;

        if (zz0 < zClip && zz1 < zClip) return;

        if (zz0 < zClip) {
            var p = (zClip - zz0) / (zz1 - zz0);
            zz0 = zz0 + (zz1 - zz0) * p;
            xx0 = xx0 + (xx1 - xx0) * p;
            xt0 = xt0 + (xt1 - xt0) * p;
        }

        if (zz1 < zClip) {
            var p = (zClip - zz0) / (zz1 - zz0);
            zz1 = zz0 + (zz1 - zz0) * p;
            xx1 = xx0 + (xx1 - xx0) * p;
            xt1 = xt0 + (xt1 - xt0) * p;
        }

        var xPixel0 = this.xCenter - (xx0 / zz0 * this.fov);
        var xPixel1 = this.xCenter - (xx1 / zz1 * this.fov);

        if (xPixel0 >= xPixel1) return;
        var i_xp0 = Math.ceil(xPixel0);
        var i_xp1 = Math.ceil(xPixel1);
        if (i_xp0 < 0) i_xp0 = 0;
        if (i_xp1 > this.width) i_xp1 = this.width;

        var yPixel00 = (u0 / zz0 * this.fov + this.yCenter);
        var yPixel01 = (l0 / zz0 * this.fov + this.yCenter);
        var yPixel10 = (u1 / zz1 * this.fov + this.yCenter);
        var yPixel11 = (l1 / zz1 * this.fov + this.yCenter);

        var iz0 = 1 / zz0;
        var iz1 = 1 / zz1;

        var iza = iz1 - iz0;

        var ixt0 = xt0 * iz0;
        var ixta = xt1 * iz1 - ixt0;
        var iw = 1 / (xPixel1 - xPixel0);

        for (var x = i_xp0; x < i_xp1; x++) {
            var pr = (x - xPixel0) * iw;
            var iz = iz0 + iza * pr;

            if (this.zBufferWall[x] > iz) continue;
            this.zBufferWall[x] = iz;
            var i_xTex = ((ixt0 + ixta * pr) / iz) << 0;

            var yPixel0 = yPixel00 + (yPixel10 - yPixel00) * pr - 0.5;
            var yPixel1 = yPixel01 + (yPixel11 - yPixel01) * pr;

            var i_yp0 = Math.ceil(yPixel0);
            var i_yp1 = Math.ceil(yPixel1);
            if (i_yp0 < 0) i_yp0 = 0;
            if (i_yp1 > this.height) i_yp1 = this.height;

            var ih = 1 / (yPixel1 - yPixel0);
            for (var y = i_yp0; y < i_yp1; y++) {
                var pry = (y - yPixel0) * ih;
                var i_yTex = 16 * pry << 0;
                var offset = ((i_xTex) + (tex % 8) * 16) + (i_yTex + (tex / 8 <<0) * 16) * 128;
                this.pixels[x + y * this.width] = pocjs.Art.walls.pixels[offset] * color;
                this.zBuffer[x + y * this.width] = 1 / iz * 4;
            }
        }
    },

    postProcess: function(level) {
        for (var i = 0; i < this.width * this.height; i++) {
            var zl = this.zBuffer[i];
            if (zl < 0) {
                var xx =  ((i % this.width) - this.rot * 512 / (Math.PI * 2)) & 511;
                var yy = (i / this.width) <<0;
                this.pixels[i] = pocjs.Art.sky.pixels[xx + yy * 512] * 0x444455;
            } else {
                var xp = (i % this.width);
                var yp = ((i / this.width) << 0) * 14;

                var xx = ((i % this.width - this.width / 2.0) / this.width);
                var col = this.pixels[i];
                var brightness = (300 - zl * 6 * (xx * xx * 2 + 1)) << 0;
                brightness = (brightness + ((xp + yp) & 3) * 4) >> 4 << 4;
                if (brightness < 0) brightness = 0;
                if (brightness > 255) brightness = 255;

                var r = (col >> 16) & 0xff;
                var g = (col >> 8) & 0xff;
                var b = (col) & 0xff;

                r = r * brightness / 255;
                g = g * brightness / 255;
                b = b * brightness / 255;

                this.pixels[i] = r << 16 | g << 8 | b;
            }
        }
    }
});

