dojo.provide("pocjs.combined");
/*
 * Extracted from pdf.js
 * https://github.com/andreasgal/pdf.js
 *
 * Copyright (c) 2011 Mozilla Foundation
 *
 * Contributors: Andreas Gal <gal@mozilla.com>
 *               Chris G Jones <cjones@mozilla.com>
 *               Shaon Barman <shaon.barman@gmail.com>
 *               Vivien Nicolas <21@vingtetun.org>
 *               Justin D'Arcangelo <justindarc@gmail.com>
 *               Yury Delendik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var DecodeStream = (function() {
  function constructor() {
    this.pos = 0;
    this.bufferLength = 0;
    this.eof = false;
    this.buffer = null;
  }

  constructor.prototype = {
    ensureBuffer: function decodestream_ensureBuffer(requested) {
      var buffer = this.buffer;
      var current = buffer ? buffer.byteLength : 0;
      if (requested < current)
        return buffer;
      var size = 512;
      while (size < requested)
        size <<= 1;
      var buffer2 = new Uint8Array(size);
      for (var i = 0; i < current; ++i)
        buffer2[i] = buffer[i];
      return this.buffer = buffer2;
    },
    getByte: function decodestream_getByte() {
      var pos = this.pos;
      while (this.bufferLength <= pos) {
        if (this.eof)
          return null;
        this.readBlock();
      }
      return this.buffer[this.pos++];
    },
    getBytes: function decodestream_getBytes(length) {
      var pos = this.pos;

      if (length) {
        this.ensureBuffer(pos + length);
        var end = pos + length;

        while (!this.eof && this.bufferLength < end)
          this.readBlock();

        var bufEnd = this.bufferLength;
        if (end > bufEnd)
          end = bufEnd;
      } else {
        while (!this.eof)
          this.readBlock();

        var end = this.bufferLength;
      }

      this.pos = end;
      return this.buffer.subarray(pos, end);
    },
    lookChar: function decodestream_lookChar() {
      var pos = this.pos;
      while (this.bufferLength <= pos) {
        if (this.eof)
          return null;
        this.readBlock();
      }
      return String.fromCharCode(this.buffer[this.pos]);
    },
    getChar: function decodestream_getChar() {
      var pos = this.pos;
      while (this.bufferLength <= pos) {
        if (this.eof)
          return null;
        this.readBlock();
      }
      return String.fromCharCode(this.buffer[this.pos++]);
    },
    makeSubStream: function decodestream_makeSubstream(start, length, dict) {
      var end = start + length;
      while (this.bufferLength <= end && !this.eof)
        this.readBlock();
      return new Stream(this.buffer, start, length, dict);
    },
    skip: function decodestream_skip(n) {
      if (!n)
        n = 1;
      this.pos += n;
    },
    reset: function decodestream_reset() {
      this.pos = 0;
    }
  };

  return constructor;
})();

var FlateStream = (function() {
  var codeLenCodeMap = new Uint32Array([
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
  ]);

  var lengthDecode = new Uint32Array([
    0x00003, 0x00004, 0x00005, 0x00006, 0x00007, 0x00008, 0x00009, 0x0000a,
    0x1000b, 0x1000d, 0x1000f, 0x10011, 0x20013, 0x20017, 0x2001b, 0x2001f,
    0x30023, 0x3002b, 0x30033, 0x3003b, 0x40043, 0x40053, 0x40063, 0x40073,
    0x50083, 0x500a3, 0x500c3, 0x500e3, 0x00102, 0x00102, 0x00102
  ]);

  var distDecode = new Uint32Array([
    0x00001, 0x00002, 0x00003, 0x00004, 0x10005, 0x10007, 0x20009, 0x2000d,
    0x30011, 0x30019, 0x40021, 0x40031, 0x50041, 0x50061, 0x60081, 0x600c1,
    0x70101, 0x70181, 0x80201, 0x80301, 0x90401, 0x90601, 0xa0801, 0xa0c01,
    0xb1001, 0xb1801, 0xc2001, 0xc3001, 0xd4001, 0xd6001
  ]);

  var fixedLitCodeTab = [new Uint32Array([
    0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c0,
    0x70108, 0x80060, 0x80020, 0x900a0, 0x80000, 0x80080, 0x80040, 0x900e0,
    0x70104, 0x80058, 0x80018, 0x90090, 0x70114, 0x80078, 0x80038, 0x900d0,
    0x7010c, 0x80068, 0x80028, 0x900b0, 0x80008, 0x80088, 0x80048, 0x900f0,
    0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c8,
    0x7010a, 0x80064, 0x80024, 0x900a8, 0x80004, 0x80084, 0x80044, 0x900e8,
    0x70106, 0x8005c, 0x8001c, 0x90098, 0x70116, 0x8007c, 0x8003c, 0x900d8,
    0x7010e, 0x8006c, 0x8002c, 0x900b8, 0x8000c, 0x8008c, 0x8004c, 0x900f8,
    0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c4,
    0x70109, 0x80062, 0x80022, 0x900a4, 0x80002, 0x80082, 0x80042, 0x900e4,
    0x70105, 0x8005a, 0x8001a, 0x90094, 0x70115, 0x8007a, 0x8003a, 0x900d4,
    0x7010d, 0x8006a, 0x8002a, 0x900b4, 0x8000a, 0x8008a, 0x8004a, 0x900f4,
    0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cc,
    0x7010b, 0x80066, 0x80026, 0x900ac, 0x80006, 0x80086, 0x80046, 0x900ec,
    0x70107, 0x8005e, 0x8001e, 0x9009c, 0x70117, 0x8007e, 0x8003e, 0x900dc,
    0x7010f, 0x8006e, 0x8002e, 0x900bc, 0x8000e, 0x8008e, 0x8004e, 0x900fc,
    0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c2,
    0x70108, 0x80061, 0x80021, 0x900a2, 0x80001, 0x80081, 0x80041, 0x900e2,
    0x70104, 0x80059, 0x80019, 0x90092, 0x70114, 0x80079, 0x80039, 0x900d2,
    0x7010c, 0x80069, 0x80029, 0x900b2, 0x80009, 0x80089, 0x80049, 0x900f2,
    0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900ca,
    0x7010a, 0x80065, 0x80025, 0x900aa, 0x80005, 0x80085, 0x80045, 0x900ea,
    0x70106, 0x8005d, 0x8001d, 0x9009a, 0x70116, 0x8007d, 0x8003d, 0x900da,
    0x7010e, 0x8006d, 0x8002d, 0x900ba, 0x8000d, 0x8008d, 0x8004d, 0x900fa,
    0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c6,
    0x70109, 0x80063, 0x80023, 0x900a6, 0x80003, 0x80083, 0x80043, 0x900e6,
    0x70105, 0x8005b, 0x8001b, 0x90096, 0x70115, 0x8007b, 0x8003b, 0x900d6,
    0x7010d, 0x8006b, 0x8002b, 0x900b6, 0x8000b, 0x8008b, 0x8004b, 0x900f6,
    0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900ce,
    0x7010b, 0x80067, 0x80027, 0x900ae, 0x80007, 0x80087, 0x80047, 0x900ee,
    0x70107, 0x8005f, 0x8001f, 0x9009e, 0x70117, 0x8007f, 0x8003f, 0x900de,
    0x7010f, 0x8006f, 0x8002f, 0x900be, 0x8000f, 0x8008f, 0x8004f, 0x900fe,
    0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c1,
    0x70108, 0x80060, 0x80020, 0x900a1, 0x80000, 0x80080, 0x80040, 0x900e1,
    0x70104, 0x80058, 0x80018, 0x90091, 0x70114, 0x80078, 0x80038, 0x900d1,
    0x7010c, 0x80068, 0x80028, 0x900b1, 0x80008, 0x80088, 0x80048, 0x900f1,
    0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c9,
    0x7010a, 0x80064, 0x80024, 0x900a9, 0x80004, 0x80084, 0x80044, 0x900e9,
    0x70106, 0x8005c, 0x8001c, 0x90099, 0x70116, 0x8007c, 0x8003c, 0x900d9,
    0x7010e, 0x8006c, 0x8002c, 0x900b9, 0x8000c, 0x8008c, 0x8004c, 0x900f9,
    0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c5,
    0x70109, 0x80062, 0x80022, 0x900a5, 0x80002, 0x80082, 0x80042, 0x900e5,
    0x70105, 0x8005a, 0x8001a, 0x90095, 0x70115, 0x8007a, 0x8003a, 0x900d5,
    0x7010d, 0x8006a, 0x8002a, 0x900b5, 0x8000a, 0x8008a, 0x8004a, 0x900f5,
    0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cd,
    0x7010b, 0x80066, 0x80026, 0x900ad, 0x80006, 0x80086, 0x80046, 0x900ed,
    0x70107, 0x8005e, 0x8001e, 0x9009d, 0x70117, 0x8007e, 0x8003e, 0x900dd,
    0x7010f, 0x8006e, 0x8002e, 0x900bd, 0x8000e, 0x8008e, 0x8004e, 0x900fd,
    0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c3,
    0x70108, 0x80061, 0x80021, 0x900a3, 0x80001, 0x80081, 0x80041, 0x900e3,
    0x70104, 0x80059, 0x80019, 0x90093, 0x70114, 0x80079, 0x80039, 0x900d3,
    0x7010c, 0x80069, 0x80029, 0x900b3, 0x80009, 0x80089, 0x80049, 0x900f3,
    0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900cb,
    0x7010a, 0x80065, 0x80025, 0x900ab, 0x80005, 0x80085, 0x80045, 0x900eb,
    0x70106, 0x8005d, 0x8001d, 0x9009b, 0x70116, 0x8007d, 0x8003d, 0x900db,
    0x7010e, 0x8006d, 0x8002d, 0x900bb, 0x8000d, 0x8008d, 0x8004d, 0x900fb,
    0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c7,
    0x70109, 0x80063, 0x80023, 0x900a7, 0x80003, 0x80083, 0x80043, 0x900e7,
    0x70105, 0x8005b, 0x8001b, 0x90097, 0x70115, 0x8007b, 0x8003b, 0x900d7,
    0x7010d, 0x8006b, 0x8002b, 0x900b7, 0x8000b, 0x8008b, 0x8004b, 0x900f7,
    0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900cf,
    0x7010b, 0x80067, 0x80027, 0x900af, 0x80007, 0x80087, 0x80047, 0x900ef,
    0x70107, 0x8005f, 0x8001f, 0x9009f, 0x70117, 0x8007f, 0x8003f, 0x900df,
    0x7010f, 0x8006f, 0x8002f, 0x900bf, 0x8000f, 0x8008f, 0x8004f, 0x900ff
  ]), 9];

  var fixedDistCodeTab = [new Uint32Array([
    0x50000, 0x50010, 0x50008, 0x50018, 0x50004, 0x50014, 0x5000c, 0x5001c,
    0x50002, 0x50012, 0x5000a, 0x5001a, 0x50006, 0x50016, 0x5000e, 0x00000,
    0x50001, 0x50011, 0x50009, 0x50019, 0x50005, 0x50015, 0x5000d, 0x5001d,
    0x50003, 0x50013, 0x5000b, 0x5001b, 0x50007, 0x50017, 0x5000f, 0x00000
  ]), 5];
  
  function error(e) {
      throw new Error(e)
  }

  function constructor(bytes) {
    //var bytes = stream.getBytes();
    var bytesPos = 0;

    var cmf = bytes[bytesPos++];
    var flg = bytes[bytesPos++];
    if (cmf == -1 || flg == -1)
      error('Invalid header in flate stream');
    if ((cmf & 0x0f) != 0x08)
      error('Unknown compression method in flate stream');
    if ((((cmf << 8) + flg) % 31) != 0)
      error('Bad FCHECK in flate stream');
    if (flg & 0x20)
      error('FDICT bit set in flate stream');

    this.bytes = bytes;
    this.bytesPos = bytesPos;

    this.codeSize = 0;
    this.codeBuf = 0;

    DecodeStream.call(this);
  }

  constructor.prototype = Object.create(DecodeStream.prototype);

  constructor.prototype.getBits = function(bits) {
    var codeSize = this.codeSize;
    var codeBuf = this.codeBuf;
    var bytes = this.bytes;
    var bytesPos = this.bytesPos;

    var b;
    while (codeSize < bits) {
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad encoding in flate stream');
      codeBuf |= b << codeSize;
      codeSize += 8;
    }
    b = codeBuf & ((1 << bits) - 1);
    this.codeBuf = codeBuf >> bits;
    this.codeSize = codeSize -= bits;
    this.bytesPos = bytesPos;
    return b;
  };

  constructor.prototype.getCode = function(table) {
    var codes = table[0];
    var maxLen = table[1];
    var codeSize = this.codeSize;
    var codeBuf = this.codeBuf;
    var bytes = this.bytes;
    var bytesPos = this.bytesPos;

    while (codeSize < maxLen) {
      var b;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad encoding in flate stream');
      codeBuf |= (b << codeSize);
      codeSize += 8;
    }
    var code = codes[codeBuf & ((1 << maxLen) - 1)];
    var codeLen = code >> 16;
    var codeVal = code & 0xffff;
    if (codeSize == 0 || codeSize < codeLen || codeLen == 0)
      error('Bad encoding in flate stream');
    this.codeBuf = (codeBuf >> codeLen);
    this.codeSize = (codeSize - codeLen);
    this.bytesPos = bytesPos;
    return codeVal;
  };

  constructor.prototype.generateHuffmanTable = function(lengths) {
    var n = lengths.length;

    // find max code length
    var maxLen = 0;
    for (var i = 0; i < n; ++i) {
      if (lengths[i] > maxLen)
        maxLen = lengths[i];
    }

    // build the table
    var size = 1 << maxLen;
    var codes = new Uint32Array(size);
    for (var len = 1, code = 0, skip = 2;
         len <= maxLen;
         ++len, code <<= 1, skip <<= 1) {
      for (var val = 0; val < n; ++val) {
        if (lengths[val] == len) {
          // bit-reverse the code
          var code2 = 0;
          var t = code;
          for (var i = 0; i < len; ++i) {
            code2 = (code2 << 1) | (t & 1);
            t >>= 1;
          }

          // fill the table entries
          for (var i = code2; i < size; i += skip)
            codes[i] = (len << 16) | val;

          ++code;
        }
      }
    }

    return [codes, maxLen];
  };

  constructor.prototype.readBlock = function() {
    function repeat(stream, array, len, offset, what) {
      var repeat = stream.getBits(len) + offset;
      while (repeat-- > 0)
        array[i++] = what;
    }

    // read block header
    var hdr = this.getBits(3);
    if (hdr & 1)
      this.eof = true;
    hdr >>= 1;

    if (hdr == 0) { // uncompressed block
      var bytes = this.bytes;
      var bytesPos = this.bytesPos;
      var b;

      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      var blockLen = b;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      blockLen |= (b << 8);
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      var check = b;
      if (typeof (b = bytes[bytesPos++]) == 'undefined')
        error('Bad block header in flate stream');
      check |= (b << 8);
      if (check != (~blockLen & 0xffff))
        error('Bad uncompressed block length in flate stream');

      this.codeBuf = 0;
      this.codeSize = 0;

      var bufferLength = this.bufferLength;
      var buffer = this.ensureBuffer(bufferLength + blockLen);
      var end = bufferLength + blockLen;
      this.bufferLength = end;
      for (var n = bufferLength; n < end; ++n) {
        if (typeof (b = bytes[bytesPos++]) == 'undefined') {
          this.eof = true;
          break;
        }
        buffer[n] = b;
      }
      this.bytesPos = bytesPos;
      return;
    }

    var litCodeTable;
    var distCodeTable;
    if (hdr == 1) { // compressed block, fixed codes
      litCodeTable = fixedLitCodeTab;
      distCodeTable = fixedDistCodeTab;
    } else if (hdr == 2) { // compressed block, dynamic codes
      var numLitCodes = this.getBits(5) + 257;
      var numDistCodes = this.getBits(5) + 1;
      var numCodeLenCodes = this.getBits(4) + 4;

      // build the code lengths code table
      var codeLenCodeLengths = Array(codeLenCodeMap.length);
      var i = 0;
      while (i < numCodeLenCodes)
        codeLenCodeLengths[codeLenCodeMap[i++]] = this.getBits(3);
      var codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths);

      // build the literal and distance code tables
      var len = 0;
      var i = 0;
      var codes = numLitCodes + numDistCodes;
      var codeLengths = new Array(codes);
      while (i < codes) {
        var code = this.getCode(codeLenCodeTab);
        if (code == 16) {
          repeat(this, codeLengths, 2, 3, len);
        } else if (code == 17) {
          repeat(this, codeLengths, 3, 3, len = 0);
        } else if (code == 18) {
          repeat(this, codeLengths, 7, 11, len = 0);
        } else {
          codeLengths[i++] = len = code;
        }
      }

      litCodeTable =
        this.generateHuffmanTable(codeLengths.slice(0, numLitCodes));
      distCodeTable =
        this.generateHuffmanTable(codeLengths.slice(numLitCodes, codes));
    } else {
      error('Unknown block type in flate stream');
    }

    var buffer = this.buffer;
    var limit = buffer ? buffer.length : 0;
    var pos = this.bufferLength;
    while (true) {
      var code1 = this.getCode(litCodeTable);
      if (code1 < 256) {
        if (pos + 1 >= limit) {
          buffer = this.ensureBuffer(pos + 1);
          limit = buffer.length;
        }
        buffer[pos++] = code1;
        continue;
      }
      if (code1 == 256) {
        this.bufferLength = pos;
        return;
      }
      code1 -= 257;
      code1 = lengthDecode[code1];
      var code2 = code1 >> 16;
      if (code2 > 0)
        code2 = this.getBits(code2);
      var len = (code1 & 0xffff) + code2;
      code1 = this.getCode(distCodeTable);
      code1 = distDecode[code1];
      code2 = code1 >> 16;
      if (code2 > 0)
        code2 = this.getBits(code2);
      var dist = (code1 & 0xffff) + code2;
      if (pos + len >= limit) {
        buffer = this.ensureBuffer(pos + len);
        limit = buffer.length;
      }
      for (var k = 0; k < len; ++k, ++pos)
        buffer[pos] = buffer[pos - dist];
    }
  };

  return constructor;
})();(function() {
  /*
  # MIT LICENSE
  # Copyright (c) 2011 Devon Govett
  # 
  # Permission is hereby granted, free of charge, to any person obtaining a copy of this 
  # software and associated documentation files (the "Software"), to deal in the Software 
  # without restriction, including without limitation the rights to use, copy, modify, merge, 
  # publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
  # to whom the Software is furnished to do so, subject to the following conditions:
  # 
  # The above copyright notice and this permission notice shall be included in all copies or 
  # substantial portions of the Software.
  # 
  # THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
  # BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
  # NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
  # DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
  # OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */  var PNG;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  PNG = (function() {
    var APNG_BLEND_OP_OVER, APNG_BLEND_OP_SOURCE, APNG_DISPOSE_OP_BACKGROUND, APNG_DISPOSE_OP_NONE, APNG_DISPOSE_OP_PREVIOUS, makeImage, scratchCanvas, scratchCtx;
    PNG.load = function(url, canvas, callback) {
      var xhr;
      if (typeof canvas === 'function') {
        callback = canvas;
      }
      xhr = new XMLHttpRequest;
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = __bind(function() {
        var data, png;
        data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
        png = new PNG(data);
        if (typeof (canvas != null ? canvas.getContext : void 0) === 'function') {
          png.render(canvas);
        }
        return typeof callback === "function" ? callback(png) : void 0;
      }, this);
      return xhr.send(null);
    };
    APNG_DISPOSE_OP_NONE = 0;
    APNG_DISPOSE_OP_BACKGROUND = 1;
    APNG_DISPOSE_OP_PREVIOUS = 2;
    APNG_BLEND_OP_SOURCE = 0;
    APNG_BLEND_OP_OVER = 1;
    function PNG(data) {
      var chunkSize, colors, delayDen, delayNum, frame, i, section, short, _ref;
      this.data = data;
      this.pos = 8;
      this.palette = [];
      this.imgData = [];
      this.transparency = {};
      this.animation = null;
      frame = null;
      while (true) {
        chunkSize = this.readUInt32();
        section = ((function() {
          var _results;
          _results = [];
          for (i = 0; i < 4; i++) {
            _results.push(String.fromCharCode(this.data[this.pos++]));
          }
          return _results;
        }).call(this)).join('');
        switch (section) {
          case 'IHDR':
            this.width = this.readUInt32();
            this.height = this.readUInt32();
            this.bits = this.data[this.pos++];
            this.colorType = this.data[this.pos++];
            this.compressionMethod = this.data[this.pos++];
            this.filterMethod = this.data[this.pos++];
            this.interlaceMethod = this.data[this.pos++];
            break;
          case 'acTL':
            this.animation = {
              numFrames: this.readUInt32(),
              numPlays: this.readUInt32() || Infinity,
              frames: []
            };
            break;
          case 'PLTE':
            this.palette = this.read(chunkSize);
            break;
          case 'fcTL':
            if (frame) {
              this.animation.frames.push(frame);
            }
            this.pos += 4;
            frame = {
              width: this.readUInt32(),
              height: this.readUInt32(),
              xOffset: this.readUInt32(),
              yOffset: this.readUInt32()
            };
            delayNum = this.readUInt16();
            delayDen = this.readUInt16() || 100;
            frame.delay = 1000 * delayNum / delayDen;
            frame.disposeOp = this.data[this.pos++];
            frame.blendOp = this.data[this.pos++];
            frame.data = [];
            break;
          case 'IDAT':
          case 'fdAT':
            if (section === 'fdAT') {
              this.pos += 4;
              chunkSize -= 4;
            }
            data = (frame != null ? frame.data : void 0) || this.imgData;
            for (i = 0; 0 <= chunkSize ? i < chunkSize : i > chunkSize; 0 <= chunkSize ? i++ : i--) {
              data.push(this.data[this.pos++]);
            }
            break;
          case 'tRNS':
            this.transparency = {};
            switch (this.colorType) {
              case 3:
                this.transparency.indexed = this.read(chunkSize);
                short = 255 - this.transparency.indexed.length;
                if (short > 0) {
                  for (i = 0; 0 <= short ? i < short : i > short; 0 <= short ? i++ : i--) {
                    this.transparency.indexed.push(255);
                  }
                }
                break;
              case 0:
                this.transparency.grayscale = this.read(chunkSize)[0];
                break;
              case 2:
                this.transparency.rgb = this.read(chunkSize);
            }
            break;
          case 'IEND':
            if (frame) {
              this.animation.frames.push(frame);
            }
            this.colors = (function() {
              switch (this.colorType) {
                case 0:
                case 3:
                case 4:
                  return 1;
                case 2:
                case 6:
                  return 3;
              }
            }).call(this);
            this.hasAlphaChannel = (_ref = this.colorType) === 4 || _ref === 6;
            colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
            this.pixelBitlength = this.bits * colors;
            this.colorSpace = (function() {
              switch (this.colors) {
                case 1:
                  return 'DeviceGray';
                case 3:
                  return 'DeviceRGB';
              }
            }).call(this);
            this.imgData = new Uint8Array(this.imgData);
            return;
          default:
            this.pos += chunkSize;
        }
        this.pos += 4;
      }
      return;
    }
    PNG.prototype.read = function(bytes) {
      var i, _results;
      _results = [];
      for (i = 0; 0 <= bytes ? i < bytes : i > bytes; 0 <= bytes ? i++ : i--) {
        _results.push(this.data[this.pos++]);
      }
      return _results;
    };
    PNG.prototype.readUInt32 = function() {
      var b1, b2, b3, b4;
      b1 = this.data[this.pos++] << 24;
      b2 = this.data[this.pos++] << 16;
      b3 = this.data[this.pos++] << 8;
      b4 = this.data[this.pos++];
      return b1 | b2 | b3 | b4;
    };
    PNG.prototype.readUInt16 = function() {
      var b1, b2;
      b1 = this.data[this.pos++] << 8;
      b2 = this.data[this.pos++];
      return b1 | b2;
    };
    PNG.prototype.decodePixels = function(data) {
      var byte, col, filter, i, left, length, p, pa, paeth, pb, pc, pixelBytes, pixels, pos, row, rowData, s, scanlineLength, upper, upperLeft, _ref, _step;
      if (data == null) {
        data = this.imgData;
      }
      if (data.length === 0) {
        return [];
      }
      data = new FlateStream(data);
      data = data.getBytes();
      pixelBytes = this.pixelBitlength / 8;
      scanlineLength = pixelBytes * this.width;
      row = 0;
      pixels = [];
      length = data.length;
      pos = 0;
      while (pos < length) {
        filter = data[pos++];
        i = 0;
        rowData = [];
        switch (filter) {
          case 0:
            while (i < scanlineLength) {
              rowData[i++] = data[pos++];
            }
            break;
          case 1:
            while (i < scanlineLength) {
              byte = data[pos++];
              left = i < pixelBytes ? 0 : rowData[i - pixelBytes];
              rowData[i++] = (byte + left) % 256;
            }
            break;
          case 2:
            while (i < scanlineLength) {
              byte = data[pos++];
              col = (i - (i % pixelBytes)) / pixelBytes;
              upper = row === 0 ? 0 : pixels[row - 1][col][i % pixelBytes];
              rowData[i++] = (upper + byte) % 256;
            }
            break;
          case 3:
            while (i < scanlineLength) {
              byte = data[pos++];
              col = (i - (i % pixelBytes)) / pixelBytes;
              left = i < pixelBytes ? 0 : rowData[i - pixelBytes];
              upper = row === 0 ? 0 : pixels[row - 1][col][i % pixelBytes];
              rowData[i++] = (byte + Math.floor((left + upper) / 2)) % 256;
            }
            break;
          case 4:
            while (i < scanlineLength) {
              byte = data[pos++];
              col = (i - (i % pixelBytes)) / pixelBytes;
              left = i < pixelBytes ? 0 : rowData[i - pixelBytes];
              if (row === 0) {
                upper = upperLeft = 0;
              } else {
                upper = pixels[row - 1][col][i % pixelBytes];
                upperLeft = col === 0 ? 0 : pixels[row - 1][col - 1][i % pixelBytes];
              }
              p = left + upper - upperLeft;
              pa = Math.abs(p - left);
              pb = Math.abs(p - upper);
              pc = Math.abs(p - upperLeft);
              if (pa <= pb && pa <= pc) {
                paeth = left;
              } else if (pb <= pc) {
                paeth = upper;
              } else {
                paeth = upperLeft;
              }
              rowData[i++] = (byte + paeth) % 256;
            }
            break;
          default:
            throw new Error("Invalid filter algorithm: " + filter);
        }
        s = [];
        for (i = 0, _ref = rowData.length, _step = pixelBytes; 0 <= _ref ? i < _ref : i > _ref; i += _step) {
          s.push(rowData.slice(i, i + pixelBytes));
        }
        pixels.push(s);
        row += 1;
      }
      return pixels;
    };
    PNG.prototype.decodePalette = function() {
      var alpha, decodingMap, i, index, palette, pixel, transparency, _ref, _ref2, _ref3, _step;
      palette = this.palette;
      transparency = (_ref = this.transparency.indexed) != null ? _ref : [];
      decodingMap = [];
      index = 0;
      for (i = 0, _ref2 = palette.length, _step = 3; 0 <= _ref2 ? i < _ref2 : i > _ref2; i += _step) {
        alpha = (_ref3 = transparency[index++]) != null ? _ref3 : 255;
        pixel = palette.slice(i, i + 3).concat(alpha);
        decodingMap.push(pixel);
      }
      return decodingMap;
    };
    PNG.prototype.copyToImageData = function(imageData, pixels) {
      var alpha, byte, colors, data, i, palette, pixel, row, v, _i, _j, _k, _len, _len2, _len3, _ref;
      colors = this.colors;
      palette = null;
      alpha = this.hasAlphaChannel;
      if (this.palette.length) {
        palette = (_ref = this._decodedPalette) != null ? _ref : this._decodedPalette = this.decodePalette();
        colors = 4;
        alpha = true;
      }
      data = imageData.data;
      i = 0;
      for (_i = 0, _len = pixels.length; _i < _len; _i++) {
        row = pixels[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          pixel = row[_j];
          if (palette) {
            pixel = palette[pixel];
          }
          if (colors === 1) {
            v = pixel[0];
            data[i++] = v;
            data[i++] = v;
            data[i++] = v;
            data[i++] = pixel[1] || 255;
          } else {
            for (_k = 0, _len3 = pixel.length; _k < _len3; _k++) {
              byte = pixel[_k];
              data[i++] = byte;
            }
            if (!alpha) {
              data[i++] = 255;
            }
          }
        }
      }
    };
    scratchCanvas = document.createElement('canvas');
    scratchCtx = scratchCanvas.getContext('2d');
    makeImage = function(imageData) {
      var img;
      scratchCtx.width = imageData.width;
      scratchCtx.height = imageData.height;
      scratchCtx.clearRect(0, 0, imageData.width, imageData.height);
      scratchCtx.putImageData(imageData, 0, 0);
      img = new Image;
      img.src = scratchCanvas.toDataURL();
      return img;
    };
    PNG.prototype.decodeFrames = function(ctx) {
      var frame, i, imageData, pixels, _len, _ref, _results;
      if (!this.animation) {
        return;
      }
      _ref = this.animation.frames;
      _results = [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        frame = _ref[i];
        imageData = ctx.createImageData(frame.width, frame.height);
        pixels = this.decodePixels(new Uint8Array(frame.data));
        this.copyToImageData(imageData, pixels);
        frame.imageData = imageData;
        _results.push(frame.image = makeImage(imageData));
      }
      return _results;
    };
    PNG.prototype.renderFrame = function(ctx, number) {
      var frame, frames, prev;
      frames = this.animation.frames;
      frame = frames[number];
      prev = frames[number - 1];
      if (number === 0) {
        ctx.clearRect(0, 0, this.width, this.height);
      }
      if ((prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_BACKGROUND) {
        ctx.clearRect(prev.xOffset, prev.yOffset, prev.width, prev.height);
      } else if ((prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_PREVIOUS) {
        ctx.putImageData(prev.imageData, prev.xOffset, prev.yOffset);
      }
      if (frame.blendOp === APNG_BLEND_OP_SOURCE) {
        ctx.clearRect(frame.xOffset, frame.yOffset, frame.width, frame.height);
      }
      return ctx.drawImage(frame.image, frame.xOffset, frame.yOffset);
    };
    PNG.prototype.animate = function(ctx) {
      var doFrame, frameNumber, frames, numFrames, numPlays, _ref;
      frameNumber = 0;
      _ref = this.animation, numFrames = _ref.numFrames, frames = _ref.frames, numPlays = _ref.numPlays;
      return (doFrame = __bind(function() {
        var f, frame;
        f = frameNumber++ % numFrames;
        frame = frames[f];
        this.renderFrame(ctx, f);
        if (numFrames > 1 && frameNumber / numFrames < numPlays) {
          return this.animation._timeout = setTimeout(doFrame, frame.delay);
        }
      }, this))();
    };
    PNG.prototype.stopAnimation = function() {
      var _ref;
      return clearTimeout((_ref = this.animation) != null ? _ref._timeout : void 0);
    };
    PNG.prototype.render = function(canvas) {
      var ctx, data;
      if (canvas._png) {
        canvas._png.stopAnimation();
      }
      canvas._png = this;
      canvas.width = this.width;
      canvas.height = this.height;
      ctx = canvas.getContext("2d");
      if (this.animation) {
        this.decodeFrames(ctx);
        return this.animate(ctx);
      } else {
        data = ctx.createImageData(this.width, this.height);
        this.copyToImageData(data, this.decodePixels());
        return ctx.putImageData(data, 0, 0);
      }
    };
    return PNG;
  })();
  window.PNG = PNG;
}).call(this);
/*
	Copyright (c) 2004-2011, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojo.DeferredList"]){
dojo._hasResource["dojo.DeferredList"]=true;
dojo.provide("dojo.DeferredList");
dojo.DeferredList=function(_1,_2,_3,_4,_5){
var _6=[];
dojo.Deferred.call(this);
var _7=this;
if(_1.length===0&&!_2){
this.resolve([0,[]]);
}
var _8=0;
dojo.forEach(_1,function(_9,i){
_9.then(function(_a){
if(_2){
_7.resolve([i,_a]);
}else{
_b(true,_a);
}
},function(_c){
if(_3){
_7.reject(_c);
}else{
_b(false,_c);
}
if(_4){
return null;
}
throw _c;
});
function _b(_d,_e){
_6[i]=[_d,_e];
_8++;
if(_8===_1.length){
_7.resolve(_6);
}
};
});
};
dojo.DeferredList.prototype=new dojo.Deferred();
dojo.DeferredList.prototype.gatherResults=function(_f){
var d=new dojo.DeferredList(_f,false,true,false);
d.addCallback(function(_10){
var ret=[];
dojo.forEach(_10,function(_11){
ret.push(_11[1]);
});
return ret;
});
return d;
};
}
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
dojo.provide("pocjs.Sound");

dojo.declare("pocjs.Sound", null, {
});

dojo.mixin(pocjs.Sound, {
    loadSound: function(name) {
        var dfd = new dojo.Deferred();
        var audio = new Audio();
        audio.addEventListener("canplay", function(res) {
            if (dfd.fired == -1) dfd.resolve(name);
        }, false);
        audio.src = "res/snd/" + name + ".wav";
        this[name] = audio;
        return dfd;
    }
});

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
        var fpixels = pocjs.Art.floors.pixels;
        var height  = this.height,  width   = this.width, 
            xCenter = this.xCenter, yCenter = this.yCenter,
            fov     = this.fov,
            xCam    = this.xCam,    yCam    = this.yCam,    zCam    = this.zCam,
            rCos    = this.rCos,    rSin    = this.rSin,
            zBuffer = this.zBuffer, pixels  = this.pixels;

        var xbase = (xCam + 0.5) * 8;
        var ybase = (yCam + 0.5) * 8;

	for (var y = 0; y < height; y++) {
	    var yd = ((y + 0.5) - yCenter) / fov;

	    var floor = true;
	    var zd = (4 - zCam * 8) / yd;
	    if (yd < 0) {
		floor = false;
		zd = (4 + zCam * 8) / -yd;
	    }

            var zSin = zd * rSin;
            var zCos = zd * rCos;

	    for (var x = 0; x < width; x++) {
		if (zBuffer[x + y * width] <= zd) continue;

		var xd = (xCenter - x) / fov;
		xd *= zd;

		var xx = xd * rCos + zSin + xbase;
                var yy = zCos - xd * rSin + ybase;

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
                    zBuffer[x + y * width] = -1;
                }
                else {
                    zBuffer[x + y * width] = zd;
                    var offset = ((i_xPix & 15) + (tex % 8) * 16) + ((i_yPix & 15) + (tex / 8 <<0) * 16) * 128;
                    pixels[x + y * width] = fpixels[offset] * col;
		}
	    }
	}

    },

    renderSprite: function(x, y, z, tex, color) {
        var height  = this.height,  width   = this.width, 
            xCenter = this.xCenter, yCenter = this.yCenter,
            fov     = this.fov,
            xCam    = this.xCam,    yCam    = this.yCam,    zCam    = this.zCam,
            rCos    = this.rCos,    rSin    = this.rSin,
            zBuffer = this.zBuffer, pixels  = this.pixels;

        var fpixels = pocjs.Art.sprites.pixels;

	var xc = (x - xCam) * 2 - rSin * 0.2;
        var yc = (y - zCam) * 2;
	var zc = (z - yCam) * 2 - rCos * 0.2;

        var xx = xc * rCos - zc * rSin;
	var yy = yc;
	var zz = zc * rCos + xc * rSin;

	if (zz < 0.1) return;

	var xPixel = xCenter - (xx / zz * fov);
	var yPixel = (yy / zz * fov + yCenter);

        var zh = height / zz;
        var xPixel0 = xPixel - zh;
	var xPixel1 = xPixel + zh;

        var yPixel0 = yPixel - zh;
        var yPixel1 = yPixel + zh;

        var i_xp0 = Math.ceil(xPixel0);
        var i_xp1 = Math.ceil(xPixel1);
        var i_yp0 = Math.ceil(yPixel0);
        var i_yp1 = Math.ceil(yPixel1);

        if (i_xp0 < 0) i_xp0 = 0;
        if (i_xp1 > width) i_xp1 = width;
        if (i_yp0 < 0) i_yp0 = 0;
        if (i_yp1 > height) i_yp1 = height;
        zz *= 4;

        var xtex = tex % 8 * 16;
        var ytex = (tex / 8 <<0) * 16;

        for (var yp = i_yp0; yp < i_yp1; yp++) {
            var ypr = (yp - yPixel0) / (yPixel1 - yPixel0);
            var i_yt = ypr * 16 <<0;
            for (var xp = i_xp0; xp < i_xp1; xp++) {
                var xpr = (xp - xPixel0) / (xPixel1 - xPixel0);
                var i_xt = xpr * 16 <<0;
                if (zBuffer[xp + yp * width] > zz) {
                    var offset = i_xt + xtex + (i_yt + ytex) * 128;
                    var col = fpixels[offset];
                    if (col >= 0) {
                        pixels[xp + yp * width] = col * color;
                        zBuffer[xp + yp * width] = zz;
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

        var xtex = tex % 8 * 16;
        var ytex = (tex / 8 <<0) * 16;
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
                var offset = i_xTex + xtex + (i_yTex + ytex) * 128;
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

dojo.provide("pocjs.gui.Sprite");

dojo.declare("pocjs.gui.Sprite", null, {
    x: null, y: null, z:null,
    tex: null,
    col: 0x202020,
    removed: false,

    constructor: function(x, y, z, tex, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.tex = tex;
        this.col = color;
    },

    tick: function() {
    }
});

dojo.provide("pocjs.gui.PoofSprite");


dojo.declare("pocjs.gui.PoofSprite", pocjs.gui.Sprite, {
    life: 20,


    "-chains-": {constructor: "manual"},
    constructor: function(x, y, z) {
        this.inherited(arguments, [x, y, z, 5, 0x222222]);
    },

    tick: function() {
	if (this.life-- <= 0) this.removed = true;
    }
});
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

dojo.provide("pocjs.entities.Item");

dojo.declare("pocjs.entities.Item", null, {

    icon: null,
    color: null,
    name: null,
    description: null,
    
    constructor: function(icon, color, name, description) {
            this.icon = icon;
            this.color = color;
            this.name = name;
            this.description = description;
    }

});

dojo.mixin(pocjs.entities.Item, {
    none:       new pocjs.entities.Item(-1, 0xFFC363, "", ""), 
    powerGlove: new pocjs.entities.Item(0, 0xFFC363, "Power Glove", "Smaaaash!!"), 
    pistol:     new pocjs.entities.Item(1, 0xEAEAEA, "Pistol", "Pew, pew, pew!"), 
    flippers:   new pocjs.entities.Item(2, 0x7CBBFF, "Flippers", "Splish splash!"), 
    cutters:    new pocjs.entities.Item(3, 0xCCCCCC, "Cutters", "Snip, snip!"), 
    skates:     new pocjs.entities.Item(4, 0xAE70FF, "Skates", "Sharp!"),
    key:        new pocjs.entities.Item(5, 0xFF4040, "Key", "How did you get this?"), 
    potion:     new pocjs.entities.Item(6, 0x4AFF47, "Potion", "Healthy!")
});
dojo.provide("pocjs.menu.Menu");

dojo.declare("pocjs.menu.Menu", null, {

    render: function(target) {
    },

    tick: function(game, up, down, left, right, use) {
    }
});

dojo.provide("pocjs.menu.AboutMenu");

dojo.declare("pocjs.menu.AboutMenu", pocjs.menu.Menu, {

    tickDelay: 30,

    render: function(target) {
        target.fill(0, 0, 160, 120, 0);

        target.drawString("About", 60, 8, pocjs.Art.getCol(0xffffff));
        
        var lines = [
            "Prelude of the Chambered",
            "by Markus Persson.",
            "Made Aug 2011 for the",
            "21'st Ludum Dare compo.",
            "",
            "This game is freeware,",
            "and was made from scratch",
            "in just 48 hours.",
        ];
        
        for (var i = 0; i < lines.length; i++) {
            target.drawString(lines[i], 4, 28+i*8, pocjs.Art.getCol(0xa0a0a0));
        }

        if (this.tickDelay == 0)
            target.drawString("-> Continue", 40, target.height - 16, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});

dojo.provide("pocjs.menu.GotLootMenu");

dojo.declare("pocjs.menu.GotLootMenu", pocjs.menu.Menu, {
    tickDelay: 30,
    item: null,

    constructor: function(item) {
        this.item = item;
    },

    render: function(target) {
        var str = "You found the " + this.item.name + "!";
        target.scaleDraw(
            pocjs.Art.items, 3, 
            target.width / 2 - 8 * 3, 2, this.item.icon * 16, 0, 16, 16,
            pocjs.Art.getCol(this.item.color));
        target.drawString(
            str, (target.width - str.length * 6) / 2 + 2, 60 - 10,
            pocjs.Art.getCol(0xffff80));

        str = this.item.description;
        target.drawString(
            str, (target.width - str.length * 6) / 2 + 2, 60,
            pocjs.Art.getCol(0xa0a0a0));

        if (this.tickDelay == 0)
            target.drawString("-> Continue", 40, target.height - 40, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            game.setMenu(null);
        }
    }
});

dojo.provide("pocjs.menu.InstructionsMenu");

dojo.declare("pocjs.menu.InstructionsMenu", pocjs.menu.Menu, {

    tickDelay: 30,

    render: function(target) {
        target.fill(0, 0, 160, 120, 0);

        target.drawString("Instructions", 40, 8, pocjs.Art.getCol(0xffffff));
        
        var lines = [
            "Use W,A,S,D to move, and",
            "the arrow keys to turn.",
            "",
            "The 1-8 keys select",
            "items from the inventory",
            "",
            "Space uses items",
        ];
        
        for (var i=0; i<lines.length; i++) {
            target.drawString(lines[i], 4, 32+i*8, pocjs.Art.getCol(0xa0a0a0));
        }

        if (this.tickDelay == 0)
            target.draw("-> Continue", 40, target.height - 16, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});

dojo.provide("pocjs.menu.LoseMenu");

dojo.declare("pocjs.menu.LoseMenu", pocjs.menu.Menu, {
	
    tickDelay: 30,
    player: null,

    constructor: function(player) {
            this.player = player;
    },

    render: function(target) {
        target.drawPart(pocjs.Art.logo, 0, 10, 0, 39, 160, 23, pocjs.Art.getCol(0xffffff));

        var seconds = this.player.time / 60 << 0;
        var minutes = seconds / 60 << 0;
        seconds %= 60;
        var timeString = minutes + ":";
        if (seconds < 10) timeString += "0";
        timeString += seconds;
        target.drawString(
            "Trinkets: " + this.player.loot + "/12",
            40, 45 + 10 * 0, pocjs.Art.getCol(0x909090));
        target.drawString(
            "Time: " + timeString,
            40, 45 + 10 * 1, pocjs.Art.getCol(0x909090));

        if (this.tickDelay == 0)
            target.drawString(
                "-> Continue", 40, target.height - 40, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});

dojo.provide("pocjs.menu.PauseMenu");

dojo.declare("pocjs.menu.PauseMenu", pocjs.menu.Menu, {

    options: [ "Abort game", "Continue" ],
    selected: 1,

    render: function(target) {
        target.drawPart(pocjs.Art.logo, 0, 8, 0, 0, 160, 36, pocjs.Art.getCol(0xffffff));

        for (var i = 0; i < this.options.length; i++) {
            var msg = this.options[i];
            var col = 0x909090;
            if (this.selected == i) {
                msg = "-> " + msg;
                col = 0xffff80;
            }
            target.drawString(msg, 40, 60 + i * 10, pocjs.Art.getCol(col));
        }
    },

    tick: function(game, up, down, left, right, use) {
        if (up || down) pocjs.Sound.click2.play();
        if (up) this.selected--;
        if (down) this.selected++;
        if (this.selected < 0) sthis.elected = 0;
        if (this.selected >= this.options.length) this.selected = this.options.length - 1;
        if (use) {
            pocjs.Sound.click1.play();
            if (this.selected == 0) {
                game.setMenu(new pocjs.menu.TitleMenu());
            }
            if (this.selected == 1) {
                game.setMenu(null);
            }
        }
    }
});

dojo.provide("pocjs.menu.TitleMenu");

dojo.declare("pocjs.menu.TitleMenu", pocjs.menu.Menu, {

    options: [ "New game", "Instructions", "About" ],
    selected: 0,
    firstTick: true,

    render: function(target) {
        target.fill(0, 0, 160, 120, 0);
        target.drawPart(pocjs.Art.logo, 0, 8, 0, 0, 160, 36, pocjs.Art.getCol(0xffffff));

        for (var i = 0; i < this.options.length; i++) {
            var msg = this.options[i];
            var col = 0x909090;
            if (this.selected == i) {
                msg = "-> " + msg;
                col = 0xffff80;
            }
            target.drawString(msg, 40, 60 + i * 10, pocjs.Art.getCol(col));
        }
        target.drawString(
            "Copyright (C) 2011 Mojang", 1+4, 120 - 9, pocjs.Art.getCol(0x303030));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.firstTick) {
            this.firstTick = false;
            pocjs.Sound.altar.play();
        }
        if (up || down) pocjs.Sound.click2.play();
        if (up) this.selected--;
        if (down) this.selected++;
        if (this.selected < 0) this.selected = 0;
        if (this.selected >= this.options.length) this.selected = this.options.length - 1;
        if (use) {
            pocjs.Sound.click1.play();
            if (this.selected == 0) {
                game.setMenu(null);
                game.newGame();
            }
            if (this.selected == 1) {
                game.setMenu(new pocjs.menu.InstructionsMenu());
            }
            if (this.selected == 2) {
                game.setMenu(new pocjs.menu.AboutMenu());
            }
        }
    }
});

dojo.provide("pocjs.menu.WinMenu");

dojo.declare("pocjs.menu.WinMenu", pocjs.menu.Menu, {

    tickDelay: 30,
    player: null,

    constructor: function(player) {
        this.player = player;
    },

    render: function(target) {
        target.drawPart(pocjs.Art.logo, 0, 10, 0, 65, 160, 23, pocjs.Art.getCol(0xffffff));

        var seconds = this.player.time / 60 << 0;
        var minutes = seconds / 60 << 0;
        seconds %= 60;
        var timeString = minutes + ":";
        if (seconds < 10) timeString += "0";
        timeString += seconds;
        target.drawString(
            "Trinkets: " + this.player.loot + "/12",
            40, 45 + 10 * 0, pocjs.Art.getCol(0x909090));
        target.drawString(
            "Time: " + timeString,
            40, 45 + 10 * 1, pocjs.Art.getCol(0x909090));

        if (this.tickDelay == 0)
            target.drawString(
                "-> Continue", 40, target.height - 40, pocjs.Art.getCol(0xffff80));
    },

    tick: function(game, up, down, left, right, use) {
        if (this.tickDelay > 0) this.tickDelay--;
        else if (use) {
            pocjs.Sound.click1.play();
            game.setMenu(new pocjs.menu.TitleMenu());
        }
    }
});
dojo.provide("pocjs.entities.Entity");


dojo.declare("pocjs.entities.Entity", null, {

    sprites: null,

    x: 0, z: 0, rot: 0,
    xa: 0, za: 0,  rota: 0,
    r: 0.4,

    level: null,
    xTileO: -1,
    zTileO: -1,
    flying: false,

    removed: false,

    //constructor: function(a, b, c, d) {
    constructor: function(x, z, defaultTex, defaultColor) {
        this.sprites = [];
    },
    updatePos: function() {
        var xTile = (this.x + 0.5) << 0;
        var zTile = (this.z + 0.5) << 0;
        if (xTile != this.xTileO || zTile != this.zTileO) {
            this.level.getBlock(this.xTileO, this.zTileO).removeEntity(this);

            this.xTileO = xTile;
            this.zTileO = zTile;

            if (!this.removed) this.level.getBlock(this.xTileO, this.zTileO).addEntity(this);
        }
    },

    isRemoved: function() {
        return this.removed;
    },

    remove: function() {
        this.level.getBlock(this.xTileO, this.zTileO).removeEntity(this);
        this.removed = true;
    },

    move: function() {

        var xSteps = (Math.abs(this.xa * 100) + 1) << 0;
        for (var i = xSteps; i > 0; i--) {
            var xxa = this.xa;
            if (this.isFree(this.x + xxa * i / xSteps, this.z)) {
                this.x += xxa * i / xSteps;
                break;
            } else {
                this.xa = 0;
            }
        }

        var zSteps = (Math.abs(this.za * 100) + 1) << 0;
        for (var i = zSteps; i > 0; i--) {
            var zza = this.za;
            if (this.isFree(this.x, this.z + zza * i / zSteps)) {
                this.z += zza * i / zSteps;
                break;
            } else {
                this.za = 0;
            }
        }
    },

    isFree: function(xx, yy) {
        var x0 = Math.floor(xx + 0.5 - this.r);
        var x1 = Math.floor(xx + 0.5 + this.r);
        var y0 = Math.floor(yy + 0.5 - this.r);
        var y1 = Math.floor(yy + 0.5 + this.r);


        if (this.level.getBlock(x0, y0).blocks(this)) return false;
        if (this.level.getBlock(x1, y0).blocks(this)) return false;
        if (this.level.getBlock(x0, y1).blocks(this)) return false;
        if (this.level.getBlock(x1, y1).blocks(this)) return false;

        var xc = Math.floor(xx + 0.5);
        var zc = Math.floor(yy + 0.5);
        var rr = 2;
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.level.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (e == this) continue;

                    if (e.blocks(this, xx, yy, this.r)) {
                        e.collide(this);
                        this.collide(e);
                        return false;
                    }
                }
            }
        }
        return true;
    },

    collide: function(entity) {
    },

    blocks: function(entity, x2, z2, r2) {
        if (entity instanceof pocjs.entities.Bullet) {
            if (entity.owner == this) return false;
        }
        if (this.x + this.r <= x2 - r2) return false;
        if (this.x - this.r >= x2 + r2) return false;

        if (this.z + this.r <= z2 - r2) return false;
        if (this.z - this.r >= z2 + r2) return false;

        return true;
    },

    contains: function(x2, z2) {
        if (this.x + this.r <= x2) return false;
        if (this.x - this.r >= x2) return false;

        if (this.z + this.r <= z2) return false;
        if (this.z - this.r >= z2) return false;

        return true;
    },

    isInside: function(x0, z0, x1, z1) {
        if (this.x + this.r <= x0) return false;
        if (this.x - this.r >= x1) return false;

        if (this.z + this.r <= z0) return false;
        if (this.z - this.r >= z1) return false;

        return true;
    },

    use: function(source, item) {
        return false;
    },

    tick: function() {
    }
});

dojo.provide("pocjs.entities.Player");

dojo.declare("pocjs.entities.Player", pocjs.entities.Entity, {
    bob: null, bobPhase: null, turnBob: null,
    selectedSlot: 0,
    itemUseTime: 0,
    y: null, ya: null,
    hurtTime: 0,
    health: 20,
    keys: 0,
    loot: 0,
    dead: false,
    deadTime: 0,
    ammo: 0,
    potions: 0,
    lastBlock: null,

    items: null,

    constructor: function() {
        this.r = 0.3;
        this.items = new Array(8);
        for (var i = 0; i < this.items.length; i++) {
            this.items[i] = pocjs.entities.Item.none;
        }
    },

    sliding: false,
    time: null,

    tick: function(up, down, left, right, turnLeft, turnRight) {
        if (this.dead) {
            up = down = left = right = turnLeft = turnRight = false;
            this.deadTime++;
            if (this.deadTime > 60 * 2) {
                this.level.lose();
            }
        }
        else {
            this.time++;
        }

        if (this.itemUseTime > 0) this.itemUseTime--;
        if (this.hurtTime > 0) this.hurtTime--;

        var onBlock = this.level.getBlock((this.x + 0.5) << 0, (this.z + 0.5) << 0);

        var fh = onBlock.getFloorHeight(this);
        if (onBlock instanceof pocjs.level.block.WaterBlock
                && !(this.lastBlock instanceof pocjs.level.block.WaterBlock)) {
            pocjs.Sound.splash.play();
        }

        this.lastBlock = onBlock;

        if (this.dead) fh = -0.6;
        if (fh > this.y) {
            this.y += (fh - this.y) * 0.2;
            this.ya = 0;
        } else {
            this.ya -= 0.01;
            this.y += this.ya;
            if (this.y < fh) {
                this.y = fh;
                this.ya = 0;
            }
        }

        var rotSpeed = 0.05;
        var walkSpeed = 0.03 * onBlock.getWalkSpeed(this);

        if (turnLeft) this.rota += rotSpeed;
        if (turnRight) this.rota -= rotSpeed;

        var xm = 0;
        var zm = 0;
        if (up) zm--;
        if (down) zm++;
        if (left) xm--;
        if (right) xm++;
        var dd = xm * xm + zm * zm;
        if (dd > 0) dd = Math.sqrt(dd);
        else dd = 1;
        xm /= dd;
        zm /= dd;

        this.bob *= 0.6;
        this.turnBob *= 0.8;
        this.turnBob += this.rota;
        this.bob += Math.sqrt(xm * xm + zm * zm);
        this.bobPhase += Math.sqrt(xm * xm + zm * zm) * onBlock.getWalkSpeed(this);
        var wasSliding = this.sliding;
        this.sliding = false;

        if (onBlock instanceof pocjs.level.block.IceBlock
                && this.getSelectedItem() != pocjs.entities.Item.skates) {
            if (this.xa * this.xa > this.za * this.za) {
                this.sliding = true;
                this.za = 0;
                if (this.xa > 0) this.xa = 0.08;
                else this.xa = -0.08;
                this.z += ( Math.floor(this.z + 0.5) - this.z) * 0.2;
            }
            else if (this.xa * this.xa < this.za * this.za) {
                this.sliding = true;
                this.xa = 0;
                if (this.za > 0) this.za = 0.08;
                else this.za = -0.08;
                this.x += ( Math.floor(this.x + 0.5) - this.x) * 0.2;
            }
            else {
                this.xa -= (xm * Math.cos(this.rot) + zm * Math.sin(this.rot)) * 0.1;
                this.za -= (zm * Math.cos(this.rot) - xm * Math.sin(this.rot)) * 0.1;
            }

            if (!wasSliding && this.sliding) {
                pocjs.Sound.slide.play();
            }
        }
        else {
            this.xa -= (xm * Math.cos(this.rot) + zm * Math.sin(this.rot)) * walkSpeed;
            this.za -= (zm * Math.cos(this.rot) - xm * Math.sin(this.rot)) * walkSpeed;
        }

        this.move();

        var friction = onBlock.getFriction(this);
        this.xa *= friction;
        this.za *= friction;
        this.rot += this.rota;
        this.rota *= 0.4;
    },

    activate: function() {
        if (this.dead) return;
        if (this.itemUseTime > 0) return;
        var item = this.items[this.selectedSlot];
        if (item == pocjs.entities.Item.pistol) {
            if (this.ammo > 0) {
                pocjs.Sound.shoot.play();
                this.itemUseTime = 10;
                this.level.addEntity(
                    new pocjs.entities.Bullet(
                        this, this.x, this.z, this.rot, 1, 0, 0xffffff));
                this.ammo--;
            }
            return;
        }
        if (item == pocjs.entities.Item.potion) {
            if (this.potions > 0 && this.health < 20) {
                pocjs.Sound.potion.play();
                this.itemUseTime = 20;
                this.health += 5 + (Math.random() * 6 << 0);
                if (this.health > 20) this.health = 20;
                this.potions--;
            }
            return;
        }
        if (item == pocjs.entities.Item.key) this.itemUseTime = 10;
        if (item == pocjs.entities.Item.powerGlove) this.itemUseTime = 10;
        if (item == pocjs.entities.Item.cutters) this.itemUseTime = 10;

        var xa = (2 * Math.sin(this.rot));
        var za = (2 * Math.cos(this.rot));

        var rr = 3;
        var xc = (this.x + 0.5) << 0;
        var zc = (this.z + 0.5) << 0;
        var possibleHits = [];
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.level.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (e == this) continue;
                    possibleHits.push(e);
                }
            }
        }

        var divs = 100;
        for (var i = 0; i < divs; i++) {
            var xx = this.x + xa * i / divs;
            var zz = this.z + za * i / divs;
            for (var j = 0; j < possibleHits.length; j++) {
                var e = possibleHits[j];
                if (e.contains(xx, zz)) {
                    if (e.use(this, this.items[this.selectedSlot])) {
                        return;
                    }
                }

            }
            if (this.level.getBlock( (xx + 0.5) << 0, (zz + 0.5) << 0)
                          .use( this.level, this.items[this.selectedSlot])) {
                return;
            }
        }
    },

    blocks: function(entity, x2, z2, r2) {
        if (entity instanceof pocjs.entities.Bullet) return false;
        return this.inherited(arguments);
    },

    getSelectedItem: function() {
        return this.items[this.selectedSlot];
    },

    addLoot: function(item) {
        if (item == pocjs.entities.Item.pistol) this.ammo += 20;
        if (item == pocjs.entities.Item.potion) this.potions += 1;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] == item) {
                this.level.showLootScreen(item);
                return;
            }
        }

        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] == pocjs.entities.Item.none) {
                this.items[i] = item;
                this.selectedSlot = i;
                this.itemUseTime = 0;
                this.level.showLootScreen(item);
                return;
            }
        }
    },

    hurt: function(enemy, dmg) {
        if (this.hurtTime > 0 || this.dead) return;

        this.hurtTime = 40;
        this.health -= dmg;

        if (this.health <= 0) {
            this.health = 0;
            pocjs.Sound.death.play();
            this.dead = true;
        }

        pocjs.Sound.hurt.play();

        var xd = enemy.x - this.x;
        var zd = enemy.z - this.z;
        var dd = Math.sqrt(xd * xd + zd * zd);
        this.xa -= xd / dd * 0.1;
        this.za -= zd / dd * 0.1;
        this.rota += (Math.random() - 0.5) * 0.2;
    },

    collide: function(entity) {
        if (entity instanceof pocjs.entities.Bullet) {
            var bullet = entity;
            if (bullet.owner.declaredClass == this.declaredClass) {
                return;
            }
            if (this.hurtTime > 0) return;
            entity.remove();
            this.hurt(entity, 1);
        }
    },

    win: function() {
        this.level.win();
    }
});
dojo.provide("pocjs.entities.EnemyEntity");

dojo.declare("pocjs.entities.EnemyEntity", pocjs.entities.Entity, {

    sprite: null,
    rot: 0,
    rota: 0,
    defaultTex: null,
    defaultColor: null,
    hurtTime:  0,
    animTime:  0,
    health:  3,
    spinSpeed:  0.1,
    runSpeed:  1,

    constructor: function(x, z, defaultTex, defaultColor) {

        this.inherited(arguments);
        this.x = x;
        this.z = z;
        this.defaultColor = defaultColor;
        this.defaultTex = defaultTex;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 4 * 8, defaultColor);
        this.sprites.push(this.sprite);
        this.r = 0.3;
    },

    haveNextGaussian: false,
    nextNextGaussian: null,
    nextGaussian: function() {
        if (this.haveNextNextGaussian) {
            this.haveNextNextGaussian = false;
            return this.nextNextGaussian;
        }
        else {
            var v1, v2, s;
            do {
                v1 = 2 * Math.random() - 1;   // between -1.0 and 1.0
                v2 = 2 * Math.random() - 1;   // between -1.0 and 1.0
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
            var multiplier = Math.sqrt(-2 * Math.log(s)/s);
            this.nextNextGaussian = v2 * multiplier;
            this.haveNextNextGaussian = true;
            return v1 * multiplier;
        }
    },

    tick: function() {
        if (this.hurtTime > 0) {
            this.hurtTime--;
            if (this.hurtTime == 0) {
                this.sprite.col = this.defaultColor;
            }
        }
        this.animTime++;
        this.sprite.tex = this.defaultTex + (this.animTime / 10 <<0) % 2;
        this.move();
        if (this.xa == 0 || this.za == 0) {
            this.rota += (this.nextGaussian() * Math.random()) * 0.3;
        }

        this.rota += (this.nextGaussian() * Math.random()) * this.spinSpeed;
        this.rot += this.rota;
        this.rota *= 0.8;
        this.xa *= 0.8;
        this.za *= 0.8;
        this.xa += Math.sin(this.rot) * 0.004 * this.runSpeed;
        this.za += Math.cos(this.rot) * 0.004 * this.runSpeed;
    },

    use: function(source, item) {
        if (this.hurtTime > 0) return false;
        if (item != pocjs.entities.Item.powerGlove) return false;

        this.hurt(Math.sin(source.rot), Math.cos(source.rot));

        return true;
    },

    hurt: function(xd, zd) {
        this.sprite.col = pocjs.Art.getCol(0xff0000);
        this.hurtTime = 15;

        var dd = Math.sqrt(xd * xd + zd * zd);
        this.xa += xd / dd * 0.2;
        this.za += zd / dd * 0.2;
        pocjs.Sound.hurt2.play();
        this.health--;
        if (this.health <= 0) {
            var xt = (this.x + 0.5) << 0;
            var zt = (this.z + 0.5) << 0;
            this.level.getBlock(xt, zt)
                      .addSprite(new pocjs.gui.PoofSprite(this.x - xt, 0, this.z - zt));
            this.die();
            this.remove();
            pocjs.Sound.kill.play();
        }
    },

    die: function() {

    },

    collide: function(entity) {
        if (entity instanceof pocjs.entities.Bullet) {
            var bullet = entity;
            if (bullet.owner.declaredClass == this.declaredClass) {
                return;
            }
            if (this.hurtTime > 0) return;
            entity.remove();
            this.hurt(entity.xa, entity.za);
        }
        if (entity instanceof pocjs.entities.Player) {
            entity.hurt(this, 1);
        }
    }
});
dojo.provide("pocjs.entities.BatBossEntity");

dojo.declare("pocjs.entities.BatBossEntity", pocjs.entities.EnemyEntity, {

    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 5;
        this.r = 0.3;
        
        this.flying = true;
    },

    die: function() {
        pocjs.Sound.bosskill.play();
        this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.z));
    },

    tick: function() {
        this.inherited(arguments);
        if (Math.random() * 20 < 1) {
            var xx = this.x + (Math.random() - 0.5) * 2;
            var zz = this.z + (Math.random() - 0.5) * 2;
            var batEntity = new pocjs.entities.BatEntity(xx, zz);
            batEntity.level = this.level;

            if (batEntity.isFree(xx, zz)) {
                this.level.addEntity(batEntity);
            }
        }
    }
});

dojo.provide("pocjs.entities.BatEntity");

dojo.declare("pocjs.entities.BatEntity", pocjs.entities.EnemyEntity, {

    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8, pocjs.Art.getCol(0x82666E)]);
        this.x = x;
        this.z = z;
        this.health = 2;
        this.r = 0.3;
        
        this.flying = true;
    }
});

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

dojo.provide("pocjs.entities.BoulderEntity");

dojo.declare("pocjs.entities.BoulderEntity", pocjs.entities.Entity, {
    COLOR: pocjs.Art.getCol(0xAFA293),
    sprite: null,
    rollDist: 0,

    constructor: function(x, z) {
        this.x = x;
        this.z = z;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 16, this.COLOR);
        this.sprites.push(this.sprite);
    },

    tick: function() {
        this.rollDist += Math.sqrt(this.xa * this.xa + this.za * this.za);
        this.sprite.tex = 8 + ((this.rollDist * 4) & 1);
        var xao = this.xa;
        var zao = this.za;
        this.move();
        if (this.xa == 0 && xao != 0) this.xa = -xao * 0.3;
        if (this.za == 0 && zao != 0) this.za = -zao * 0.3;
        this.xa *= 0.98;
        this.za *= 0.98;
        if (this.xa * this.xa + this.za * this.za < 0.0001) {
            this.xa = this.za = 0;
        }
    },

    use: function(source, item) {
        if (item != pocjs.entities.Item.powerGlove) return false;
        pocjs.Sound.roll.play();

        this.xa += Math.sin(source.rot) * 0.1;
        this.za += Math.cos(source.rot) * 0.1;
        return true;
    }
});
dojo.provide("pocjs.entities.Bullet");

dojo.declare("pocjs.entities.Bullet", pocjs.entities.Entity, {
    owner: null,

    constructor: function(owner, x, z, rot, pow, sprite, col) {
        this.r = 0.01;
        this.owner = owner;

        this.xa = Math.sin(rot) * 0.2 * pow;
        this.za = Math.cos(rot) * 0.2 * pow;
        this.x = x - this.za / 2;
        this.z = z + this.xa / 2;

        this.sprites.push(
            new pocjs.gui.Sprite(
                0, 0, 0, 8 * 3 + this.sprite, pocjs.Art.getCol(col)
            )
        );

        this.flying = true;
    },

    tick: function() {
        var xao = this.xa;
        var zao = this.za;
        this.move();

        if ((this.xa == 0 && this.za == 0) || this.xa != xao || this.za != zao) {
            this.remove();
        }
    },

    blocks: function(entity, x2, z2, r2) {
        if (entity instanceof pocjs.entities.Bullet) {
            return false;
        }
        if (entity === this.owner) return false;
        
        return this.inherited(arguments);
    },

    collide: function(entity) {
    }
});

dojo.provide("pocjs.entities.EyeBossEntity");

dojo.declare("pocjs.entities.EyeBossEntity", pocjs.entities.EnemyEntity, {


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 4, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 10;
        this.r = 0.3;
        this.runSpeed = 4;
        this.spinSpeed *= 1.5;

        this.flying = true;
    },

    die: function() {
        pocjs.Sound.bosskill.play();
        this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.z));
    }
});
dojo.provide("pocjs.entities.EyeEntity");

dojo.declare("pocjs.entities.EyeEntity", pocjs.entities.EnemyEntity, {

    "-chains-": {constructor: "manual"},

    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8+4, pocjs.Art.getCol(0x84ECFF)]);
        this.x = x;
        this.z = z;
        this.health = 4;
        this.r = 0.3;
        this.runSpeed = 2;
        this.spinSpeed *= 1.5;
        
        this.flying = true;
    }
});
dojo.provide("pocjs.entities.GhostBossEntity");

dojo.declare("pocjs.entities.GhostBossEntity", pocjs.entities.EnemyEntity, {
    rotatePos: 0,
    shootDelay: 0,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 6, pocjs.Art.getCol(0xffff00)]);
        this.x = x;
        this.z = z;
        this.health = 10;
        this.flying = true;
    },

    tick: function() {
        this.animTime++;
        this.sprite.tex = this.defaultTex + (this.animTime / 10 | 0 ) % 2;

        var xd = (this.level.player.x + Math.sin(this.rotatePos) * 2) - this.x;
        var zd = (this.level.player.z + Math.cos(this.rotatePos) * 2) - this.z;
        var dd = xd * xd + zd * zd;

        if (dd < 1) {
            this.rotatePos += 0.04;
        } else {
            this.rotatePos = this.level.player.rot;
        }
        if (dd < 4 * 4) {
            dd = Math.sqrt(dd);

            xd /= dd;
            zd /= dd;

            this.xa += xd * 0.006;
            this.za += zd * 0.006;
            
            if (this.shootDelay > 0) this.shootDelay--;
            else if ((Math.random() * 10 | 0) == 0) {
                this.shootDelay = 10;
                this.level.addEntity(
                    new pocjs.entities.Bullet(
                        this, this.x, this.z,
                        Math.atan2( this.level.player.x - this.x, this.level.player.z - this.z),
                        0.20, 1, this.defaultColor));
            }

        }

        this.move();

        this.xa *= 0.9;
        this.za *= 0.9;
    },

    hurt: function(xd, zd) {
    },

    move: function() {
        this.x += this.xa;
        this.z += this.za;
    }
});

dojo.provide("pocjs.entities.GhostEntity");

dojo.declare("pocjs.entities.GhostEntity", pocjs.entities.EnemyEntity, {
    rotatePos: 0,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 6, pocjs.Art.getCol(0xffffff)]);
        this.x = x;
        this.z = z;
        this.health = 4;
        this.r = 0.3;

        this.flying = true;
    },

    tick: function() {
        this.animTime++;
        this.sprite.tex = this.defaultTex + (this.animTime / 10 << 0) % 2;

        var xd = (this.level.player.x + Math.sin(this.rotatePos)) - this.x;
        var zd = (this.level.player.z + Math.cos(this.rotatePos)) - this.z;
        var dd = xd * xd + zd * zd;

        if (dd < 4 * 4) {
            if (dd < 1) {
                this.rotatePos += 0.04;
            } else {
                this.rotatePos = this.level.player.rot;
                this.xa += (Math.random() - 0.5) * 0.02;
                this.za += (Math.random() - 0.5) * 0.02;
            }
            
            dd = Math.sqrt(dd);

            xd /= dd;
            zd /= dd;

            this.xa += xd * 0.004;
            this.za += zd * 0.004;
        }

        this.move();

        this.xa *= 0.9;
        this.za *= 0.9;
    },

    hurt: function(xd, zd) {
    },

    move: function() {
        this.x += this.xa;
        this.z += this.za;
    }
});
dojo.provide("pocjs.entities.KeyEntity");

dojo.declare("pocjs.entities.KeyEntity", pocjs.entities.Entity, {
    COLOR: pocjs.Art.getCol(0x00ffff),
    sprite:  null,
    y: null, ya: null,

    constructor: function(x, z) {
        this.x = x;
        this.z = z;
        this.y = 0.5;
        this.ya = 0.025;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 16 + 3, this.COLOR);
        this.sprites.push(this.sprite);
    },

    tick: function() {
        this.move();
        this.y += this.ya;
        if (this.y < 0) this.y = 0;
        this.ya -= 0.005;
        this.sprite.y = this.y;
    },

    collide: function(entity) {
        if (entity instanceof pocjs.entities.Player) {
            pocjs.Sound.key.play();
            entity.keys++;
            this.remove();
        }
    }
});
dojo.provide("pocjs.entities.OgreEntity");

dojo.declare("pocjs.entities.OgreEntity", pocjs.entities.EnemyEntity, {

    shootDelay: null,


    "-chains-": {constructor: "manual"},
    constructor: function(x, z) {
        this.inherited(arguments, [x, z, 4 * 8 + 2, pocjs.Art.getCol(0x82A821)]);
        this.x = x;
        this.z = z;
        this.health = 6;
        this.r = 0.4;
        this.spinSpeed = 0.05;
    },

    hurt: function(xd, zd) {
        this.inherited(arguments);
        this.shootDelay = 50;
    },

    tick: function() {
        this.inherited(arguments);
        if (this.shootDelay > 0) this.shootDelay--;
        else if ((Math.random() * 40 << 0) == 0) {
            this.shootDelay = 40;
            this.level.addEntity(
                new pocjs.entities.Bullet(
                    this, this.x, this.z, 
                    Math.atan2(
                        this.level.player.x - this.x, this.level.player.z - this.z
                    ),
                    0.3, 1, this.defaultColor));
        }
    }
});
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

dojo.require("pocjs.level.block.SolidBlock");

dojo.extend(pocjs.level.block.Block, {
    solidWall: new pocjs.level.block.SolidBlock()
});

dojo.provide("pocjs.level.block.SolidBlock");

dojo.declare("pocjs.level.block.SolidBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.solidRender = true;
        this.blocksMotion = true;
    }
});

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

dojo.provide("pocjs.level.block.LockedDoorBlock");

dojo.declare("pocjs.level.block.LockedDoorBlock", pocjs.level.block.DoorBlock, {
    constructor: function() {
        this.tex = 5;
    },

    use: function(level, item) {
        return false;
    },

    trigger: function(pressed) {
        this.open = pressed;
    }

});
dojo.provide("pocjs.level.block.AltarBlock");

dojo.declare("pocjs.level.block.AltarBlock", pocjs.level.block.Block, {
    filled: false,
    sprite: null,

    constructor: function() {
        this.blocksMotion = true;
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 16 + 4, pocjs.Art.getCol(0xE2FFE4));
        this.addSprite(this.sprite);
    },

    addEntity: function(entity) {
        this.inherited(arguments);
        if (!this.filled && (
                entity instanceof pocjs.entities.GhostEntity ||
                entity instanceof pocjs.entities.GhostBossEntity)) {
            entity.remove();
            this.filled = true;
            this.blocksMotion = false;
            this.sprite.removed = true;

            for (var i = 0; i < 8; i++) {
                var sprite = new pocjs.gui.RubbleSprite();
                sprite.col = this.sprite.col;
                this.addSprite(sprite);
            }

            if (entity instanceof pocjs.entities.GhostBossEntity) {
                this.level.addEntity(new pocjs.entities.KeyEntity(this.x, this.y));
                pocjs.Sound.bosskill.play();
            } else {
                pocjs.Sound.altar.play();
            }
        }
    },

    blocks: function(entity) {
        return this.blocksMotion;
    }
});
dojo.provide("pocjs.level.block.BarsBlock");

dojo.declare("pocjs.level.block.BarsBlock", pocjs.level.block.Block, {
    sprite: null,
    open: false,

    constructor: function() {
        this.sprite = new pocjs.gui.Sprite(0, 0, 0, 0, 0x202020);
        this.addSprite(this.sprite);
        this.blocksMotion = true;
    },

    use: function(level, item) {
        if (this.open) return false;

        if (item == pocjs.entities.Item.cutters) {
            pocjs.Sound.cut.play();
            this.sprite.tex = 1;
            this.open = true;
        }

        return true;
    },

    blocks: function(entity) {
        if (this.open && entity instanceof pocjs.entities.Player) return false;
        if (this.open && entity instanceof pocjs.entities.Bullet) return false;
        return this.blocksMotion;
    }
});
dojo.provide("pocjs.level.block.ChestBlock");

dojo.declare("pocjs.level.block.ChestBlock", pocjs.level.block.Block, {
    open: false,

    chestSprite: null,

    constructor: function() {
        this.tex = 1;
        this.blocksMotion = true;

        this.chestSprite = new pocjs.gui.Sprite(0, 0, 0, 8 * 2 + 0, pocjs.Art.getCol(0xffff00));
        this.addSprite(this.chestSprite);
    },

    use: function(level, item) {
        if (this.open) return false;

        this.chestSprite.tex++;
        this.open = true;

        level.getLoot(this.id);
        pocjs.Sound.treasure.play();

        return true;
    }
});

dojo.provide("pocjs.level.block.FinalUnlockBlock");

dojo.declare("pocjs.level.block.FinalUnlockBlock", pocjs.level.block.SolidBlock, {
    pressed: false,

    constructor: function() {
        this.tex = 8 + 3;
    },

    use: function(level, item) {
        if (this.pressed) return false;
        if (level.player.keys < 4) return false;

        pocjs.Sound.click1.play();
        this.pressed = true;
        level.trigger(this.id, true);

        return true;
    }
});

dojo.provide("pocjs.level.block.IceBlock");

dojo.declare("pocjs.level.block.IceBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.blocksMotion = false;
        this.floorTex = 16;
    },

    tick: function() {
        this.inherited(arguments);
        this.floorCol = pocjs.Art.getCol(0x8080ff);
    },

    getWalkSpeed: function(player) {
        if (player.getSelectedItem() == pocjs.entities.Item.skates) return 0.05;
        return 1.4;
    },

    getFriction: function(player) {
        if (player.getSelectedItem() == pocjs.entities.Item.skates) return 0.98;
        return 1;
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Player) return false;
        if (entity instanceof pocjs.entities.Bullet) return false;
        if (entity instanceof pocjs.entities.EyeBossEntity) return false;
        if (entity instanceof pocjs.entities.EyeEntity) return false;
        return true;
    }
});

dojo.provide("pocjs.level.block.LadderBlock");

dojo.declare("pocjs.level.block.LadderBlock", pocjs.level.block.Block, {
    LADDER_COLOR: 0xDB8E53,
    wait: null,

    constructor: function(down) {
        if (down) {
            this.floorTex = 1;
            this.addSprite(
                new pocjs.gui.Sprite(
                    0, 0, 0, 8 + 3, pocjs.Art.getCol(this.LADDER_COLOR)));
        }
        else {
            this.ceilTex = 1;
            this.addSprite(
                new pocjs.gui.Sprite(
                    0, 0, 0, 8 + 4, pocjs.Art.getCol(this.LADDER_COLOR)));
        }
    },

    removeEntity: function(entity) {
        this.inherited(arguments);
        if (entity instanceof pocjs.entities.Player) {
            this.wait = false;
        }
    },

    addEntity: function(entity) {
        this.inherited(arguments);

        if (!this.wait && entity instanceof pocjs.entities.Player) {
            this.level.switchLevel(this.id);
            pocjs.Sound.ladder.play();
        }
    }
});

dojo.provide("pocjs.level.block.LootBlock");

dojo.declare("pocjs.level.block.LootBlock", pocjs.level.block.Block, {
    taken: false,
    sprite: null,

    constructor: function() {
        this.sprite = new pocjs.gui.Sprite(
            0, 0, 0, 16 + 2, pocjs.Art.getCol(0xffff80)
        );
        this.addSprite(this.sprite);
        this.blocksMotion = true;
    },

    addEntity: function(entity) {
        this.inherited(arguments,[entity]);
        if (!this.taken && entity instanceof pocjs.entities.Player) {
            this.sprite.removed = true;
            this.taken = true;
            this.blocksMotion = false;
            entity.loot++;
            pocjs.Sound.pickup.play();
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Player) return false;
        return this.blocksMotion;
    }
});

dojo.provide("pocjs.level.block.PitBlock");

dojo.declare("pocjs.level.block.PitBlock", pocjs.level.block.Block, {
    filled: false,

    constructor: function() {
        this.floorTex = 1;
        this.blocksMotion = true;
    },

    addEntity: function(entity) {
        this.inherited(arguments);
        if (!this.filled && entity instanceof pocjs.entities.BoulderEntity) {
            entity.remove();
            this.filled = true;
            this.blocksMotion = false;
            this.addSprite(
                new pocjs.gui.Sprite(0, 0, 0, 8 + 2, pocjs.entities.BoulderEntity.COLOR)
            );
            pocjs.Sound.thud.play();
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.BoulderEntity) return false;
        return this.blocksMotion;
    }
});

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

dojo.provide("pocjs.level.block.SpiritWallBlock");

dojo.declare("pocjs.level.block.SpiritWallBlock", pocjs.level.block.Block, {
    constructor: function() {
        this.floorTex = 7;
        this.ceilTex = 7;
        this.blocksMotion = true;
        for (var i = 0; i < 6; i++) {
            var x = (Math.random() - 0.5);
            var y = (Math.random() - 0.7) * 0.3;
            var z = (Math.random() - 0.5);
            this.addSprite(
                new pocjs.gui.Sprite(
                    x, y, z,
                    4 * 8 + 6 + Math.random() * 2 << 0,
                    pocjs.Art.getCol(0x202020)));
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Bullet) return false;
        return this.inherited(arguments);
    }
});
dojo.provide("pocjs.level.block.SwitchBlock");

dojo.declare("pocjs.level.block.SwitchBlock", pocjs.level.block.SolidBlock, {
    pressed: false,

    constructor: function() {
        this.tex = 2;
    },

    use: function(level, item) {
        this.pressed = !this.pressed;
        if (this.pressed) this.tex = 3;
        else this.tex = 2;
        
        level.trigger(this.id, this.pressed);
        if (this.pressed)
            pocjs.Sound.click1.play();
        else
            pocjs.Sound.click2.play();

        return true;
    }
});
dojo.provide("pocjs.level.block.TorchBlock");

dojo.declare("pocjs.level.block.TorchBlock", pocjs.level.block.Block, {
    torchSprite: null,

    constructor: function() {
        this.torchSprite = new pocjs.gui.Sprite(0, 0, 0, 3, pocjs.Art.getCol(0xffff00));
        this.sprites.push(this.torchSprite);
    },

    decorate: function(level, x, y) {
//        Random random = new Random((x + y * 1000) * 341871231);
        var r = 0.4;
        for (var i = 0; i < 1000; i++) {
            var face = Math.random() * 4 << 0;
            if (face == 0 && level.getBlock(x - 1, y).solidRender) {
                this.torchSprite.x -= r;
                break;
            }
            if (face == 1 && level.getBlock(x, y - 1).solidRender) {
                this.torchSprite.z -= r;
                break;
            }
            if (face == 2 && level.getBlock(x + 1, y).solidRender) {
                this.torchSprite.x += r;
                break;
            }
            if (face == 3 && level.getBlock(x, y + 1).solidRender) {
                this.torchSprite.z += r;
                break;
            }
        }
    },

    tick: function() {
        this.inherited(arguments);
        if ((Math.random() * 4 << 0) == 0)
            this.torchSprite.tex = 3 + (Math.random() * 2 << 0);
    }
});

dojo.provide("pocjs.level.block.VanishBlock");

dojo.declare("pocjs.level.block.VanishBlock", pocjs.level.block.SolidBlock, {
    gone: false,

    constructor: function() {
        this.tex = 1;
    },

    use: function(level, item) {
        if (this.gone) return false;

        this.gone = true;
        this.blocksMotion = false;
        this.solidRender = false;
        pocjs.Sound.crumble.play();

        for (var i = 0; i < 32; i++) {
            var sprite = new pocjs.gui.RubbleSprite();
            sprite.col = this.col;
            this.addSprite(sprite);
        }

        return true;
    }
});

dojo.provide("pocjs.level.block.WaterBlock");

dojo.declare("pocjs.level.block.WaterBlock", pocjs.level.block.Block, {
    steps: 0,

    constructor: function() {
        this.blocksMotion = true;
    },

    tick: function() {
        this.inherited(arguments);
        this.steps--;
        if (this.steps <= 0) {
            this.floorTex = 8 + Math.random() * 3 << 0;
            this.floorCol = pocjs.Art.getCol(0x0000ff);
            this.steps = 16;
        }
    },

    blocks: function(entity) {
        if (entity instanceof pocjs.entities.Player) {
            if (entity.getSelectedItem() == pocjs.entities.Item.flippers) return false;
        }
        if (entity instanceof pocjs.entities.Bullet) return false;
        return this.blocksMotion;
    },

    getFloorHeight: function(e) {
        return -0.5;
    },

    getWalkSpeed: function(player) {
        return 0.4;
    }

});
dojo.provide("pocjs.level.block.WinBlock");

dojo.declare("pocjs.level.block.WinBlock", pocjs.level.block.Block, {
    addEntity: function(entity) {
        this.inherited(arguments);
        if (entity instanceof pocjs.entities.Player) {
            entity.win();
        }
    }
});

dojo.provide("pocjs.level.Level");

dojo.declare("pocjs.level.Level", null, {

    blocks: null,
    width: null, height: null,

    xSpawn: null,
    ySpawn: null,

    wallCol: 0xB3CEE2,
    floorCol: 0x9CA09B,
    ceilCol: 0x9CA09B,

    wallTex: 0,
    floorTex: 0,
    ceilTex: 0,

    entities: null,
    game: null,
    name: "",

    player: null,



    init: function(game, name, w, h, pixels) {
        this.game = game;

        this.player = game.player;

        this.solidWall = new pocjs.level.block.SolidBlock();
        this.solidWall.col = pocjs.Art.getCol(this.wallCol);
        this.solidWall.tex = pocjs.Art.getCol(this.wallTex);
        this.width = w;
        this.height = h;
        this.blocks = new Array(w * h << 0 );
        this.entities = [];

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var col = pixels[x + y * w] & 0xffffff;

                var id = 255 - ((pixels[x + y * w] >> 24) & 0xff);

                var block = this.getNewBlock(x, y, col);
                block.id = id;

                if (block.tex == -1) block.tex = this.wallTex;
                if (block.floorTex == -1) block.floorTex = this.floorTex;
                if (block.ceilTex == -1) block.ceilTex = this.ceilTex;
                if (block.col == -1) block.col = pocjs.Art.getCol(this.wallCol);
                if (block.floorCol == -1) block.floorCol = pocjs.Art.getCol(this.floorCol);
                if (block.ceilCol == -1) block.ceilCol = pocjs.Art.getCol(this.ceilCol);

                block.level = this;
                block.x = x;
                block.y = y;
                this.blocks[x + y * w] = block;

            }
        }
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var col = pixels[x + y * w] & 0xffffff;
                this.decorateBlock(x, y, block, col);
            }
        }
    },

    addEntity: function(e) {
        this.entities.push(e);
        e.level = this;
        e.updatePos();
    },

    removeEntityImmediately: function(player) {
        var index = this.entities.indexOf(player);
        if (index < 0) throw "element not found";

        this.entities.slice(index, 1);
        this.getBlock(player.xTileO, player.zTileO).removeEntity(player);
    },

    decorateBlock: function(x, y, block, col) {
        block.decorate(this, x, y);
        if (col == 0xFFFF00) {
            this.xSpawn = x;
            this.ySpawn = y;
        }
        if (col == 0xAA5500) this.addEntity(new pocjs.entities.BoulderEntity(x, y));
        if (col == 0xff0000) this.addEntity(new pocjs.entities.BatEntity(x, y));
        if (col == 0xff0001) this.addEntity(new pocjs.entities.BatBossEntity(x, y));
        if (col == 0xff0002) this.addEntity(new pocjs.entities.OgreEntity(x, y));
        if (col == 0xff0003) this.addEntity(new pocjs.entities.BossOgre(x, y));
        if (col == 0xff0004) this.addEntity(new pocjs.entities.EyeEntity(x, y));
        if (col == 0xff0005) this.addEntity(new pocjs.entities.EyeBossEntity(x, y));
        if (col == 0xff0006) this.addEntity(new pocjs.entities.GhostEntity(x, y));
        if (col == 0xff0007) this.addEntity(new pocjs.entities.GhostBossEntity(x, y));
        if (col == 0x1A2108 || col == 0xff0007) {
            block.floorTex = 7;
            block.ceilTex = 7;
        }

        if (col == 0xC6C6C6) block.col = pocjs.Art.getCol(0xa0a0a0);
        if (col == 0xC6C697) block.col = pocjs.Art.getCol(0xa0a0a0);
        if (col == 0x653A00) {
            block.floorCol = pocjs.Art.getCol(0xB56600);
            block.floorTex = 3 * 8 + 1;
        }

        if (col == 0x93FF9B) {
            block.col = pocjs.Art.getCol(0x2AAF33);
            block.tex = 8;
        }
    },

    getNewBlock: function(x, y, col) {
        if (col == 0x93FF9B) return new pocjs.level.block.SolidBlock();
        if (col == 0x009300) return new pocjs.level.block.PitBlock();
        if (col == 0xFFFFFF) return new pocjs.level.block.SolidBlock();
        if (col == 0x00FFFF) return new pocjs.level.block.VanishBlock();
        if (col == 0xFFFF64) return new pocjs.level.block.ChestBlock();
        if (col == 0x0000FF) return new pocjs.level.block.WaterBlock();
        if (col == 0xFF3A02) return new pocjs.level.block.TorchBlock();
        if (col == 0x4C4C4C) return new pocjs.level.block.BarsBlock();
        if (col == 0xFF66FF) return new pocjs.level.block.LadderBlock(false);
        if (col == 0x9E009E) return new pocjs.level.block.LadderBlock(true);
        if (col == 0xC1C14D) return new pocjs.level.block.LootBlock();
        if (col == 0xC6C6C6) return new pocjs.level.block.DoorBlock();
        if (col == 0x00FFA7) return new pocjs.level.block.SwitchBlock();
        if (col == 0x009380) return new pocjs.level.block.PressurePlateBlock();
        if (col == 0xff0005) return new pocjs.level.block.IceBlock();
        if (col == 0x3F3F60) return new pocjs.level.block.IceBlock();
        if (col == 0xC6C697) return new pocjs.level.block.LockedDoorBlock();
        if (col == 0xFFBA02) return new pocjs.level.block.AltarBlock();
        if (col == 0x749327) return new pocjs.level.block.SpiritWallBlock();
        if (col == 0x1A2108) return new pocjs.level.block.Block();
        if (col == 0x00C2A7) return new pocjs.level.block.FinalUnlockBlock();
        if (col == 0x000056) return new pocjs.level.block.WinBlock();

        return new pocjs.level.block.Block();
    },

    getBlock: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return this.solidWall;
        }

        var b = this.blocks[x + y * this.width];
        return b;
    },


    containsBlockingEntity: function(x0, y0, x1, y1) {
        var xc = Math.floor((x1 + x0) / 2);
        var zc = Math.floor((y1 + y0) / 2);
        var rr = 2;
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (e.isInside(x0, y0, x1, y1)) return true;
                }
            }
        }
        return false;
    },

    containsBlockingNonFlyingEntity: function(x0, y0, x1, y1) {
        var xc = Math.floor((x1 + x0) / 2);
        var zc = Math.floor((y1 + y0) / 2);
        var rr = 2;
        for (var z = zc - rr; z <= zc + rr; z++) {
            for (var x = xc - rr; x <= xc + rr; x++) {
                var es = this.getBlock(x, z).entities;
                for (var i = 0; i < es.length; i++) {
                    var e = es[i];
                    if (!e.flying && e.isInside(x0, y0, x1, y1)) return true;
                }
            }
        }
        return false;
    },

    tick: function() {
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            e.tick();
            e.updatePos();
            if (e.isRemoved()) {
                this.entities.splice(i, 1);
                i--;
            }
        }

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                this.blocks[x + y * this.width].tick();
            }
        }
    },

    trigger: function(id, pressed) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var b = this.blocks[x + y * this.width];
                if (b.id == id) {
                    b.trigger(pressed);
                }
            }
        }
    },

    switchLevel: function(id) {
    },

    findSpawn: function(id) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var b = this.blocks[x + y * this.width];
                if (b.id == id && b instanceof pocjs.level.block.LadderBlock) {
                    this.xSpawn = x;
                    this.ySpawn = y;
                }
            }
        }
    },

    getLoot: function(id) {
        if (id == 20) this.game.getLoot(pocjs.entities.Item.pistol);
        if (id == 21) this.game.getLoot(pocjs.entities.Item.potion);
    },

    win: function() {
        this.game.win(this.player);
    },

    lose: function() {
        this.game.lose(this.player);
    },

    showLootScreen: function(item) {
        this.game.setMenu(new pocjs.menu.GotLootMenu(item));
    }
});


dojo.mixin(pocjs.level.Level, {
    loaded: {},
    pixels: {},
    dims:   {},
    clear: function() {
        this.loaded = {};
    },

    loadLevelBitmap: function(name) {

        var self = this;

        var dfd = new dojo.Deferred();

        PNG.load("res/level/" + name + ".png", function(png) {
            var w = png.width;
            var h = png.height;
            var pixels = new Array(w * h << 0);
            var ppix = png.decodePixels();

            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var data = ppix[y][x];

                    var input = data[3] << 24
                              | data[0] << 16
                              | data[1] << 8
                              | data[2];
                    pixels[x + y*w] = input;
                }
            }

            self.pixels[name] = pixels;
            self.dims[name] = {w: w, h: h};
            dfd.resolve(name);
        });
        return dfd;

    },

    loadLevel: function(game, name) {
        if (name in this.loaded) return this.loaded[name];
        var level = this.byName(name);
        level.init(game, name, this.dims[name].w, this.dims[name].h, this.pixels[name]);
        this.loaded[name] = level;
        return level;
    },

    byName: function(name) {
        var clazz = "pocjs.level." + name.slice(0, 1).toUpperCase() + name.slice(1) + "Level";
        //dojo.require(clazz);
        return new dojo.getObject(clazz)();
    }
});

dojo.provide("pocjs.level.CryptLevel");

dojo.declare("pocjs.level.CryptLevel", pocjs.level.Level, {
    constructor: function() {
            this.floorCol = 0x404040;
            this.ceilCol = 0x404040;
            this.wallCol = 0x404040;
            this.name = "The Crypt";
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("overworld", 2);
    },

    getLoot: function(id) {
            this.inherited(arguments);
            if (id == 1) this.game.getLoot(pocjs.entities.Item.flippers);
    }
});
dojo.provide("pocjs.level.DungeonLevel");

dojo.declare("pocjs.level.DungeonLevel", pocjs.level.Level, {
    constructor: function() {
        this.wallCol = 0xC64954;
        this.floorCol = 0x8E4A51;
        this.ceilCol = 0x8E4A51;
        this.name = "The Dungeons";
    },

    init: function(game, name, w, h, pixels) {
        this.inherited(arguments);
        this.inherited("trigger", [6, true]);
        this.inherited("trigger",[7, true]);
    },

    switchLevel: function(id) {
        if (id == 1) this.game.switchLevel("start", 2);
    },

    getLoot: function(id) {
        this.inherited(arguments);
        if (id == 1) this.game.getLoot(pocjs.entities.Item.powerGlove);
    },

    trigger: function(id, pressed) {
        this.inherited(arguments);
        if (id == 5) this.inherited("trigger", [6, !pressed]);
        if (id == 4) this.inherited("trigger", [7, !pressed]);
    }
});
dojo.provide("pocjs.level.DungeonLevel");

dojo.declare("pocjs.level.DungeonLevel", pocjs.level.Level, {
    constructor: function() {
        this.wallCol = 0xC64954;
        this.floorCol = 0x8E4A51;
        this.ceilCol = 0x8E4A51;
        this.name = "The Dungeons";
    },

    init: function(game, name, w, h, pixels) {
        this.inherited(arguments);
        this.inherited("trigger", [6, true]);
        this.inherited("trigger",[7, true]);
    },

    switchLevel: function(id) {
        if (id == 1) this.game.switchLevel("start", 2);
    },

    getLoot: function(id) {
        this.inherited(arguments);
        if (id == 1) this.game.getLoot(pocjs.entities.Item.powerGlove);
    },

    trigger: function(id, pressed) {
        this.inherited(arguments);
        if (id == 5) this.inherited("trigger", [6, !pressed]);
        if (id == 4) this.inherited("trigger", [7, !pressed]);
    }
});
dojo.provide("pocjs.level.IceLevel");

dojo.declare("pocjs.level.IceLevel", pocjs.level.Level, {
    constructor: function() {
            this.wallCol =  0xB8DBE0;
            this.floorCol = 0xB8DBE0;
            this.ceilCol =  0x6BE8FF;
            this.name = "The Frost Cave";
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("overworld", 5);
    },

    getLoot: function(id) {
            this.inherited(arguments);
            if (id == 1) this.game.getLoot(pocjs.entities.Item.skates);
    }

});
dojo.provide("pocjs.level.OverworldLevel");

dojo.declare("pocjs.level.OverworldLevel", pocjs.level.Level, {
    constructor: function() {
            this.ceilTex = -1;
            this.floorCol = 0x508253;
            this.floorTex = 8 * 3;
            this.wallCol = 0xa0a0a0;
            this.name = "The Island";
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("start", 1);
            if (id == 2) this.game.switchLevel("crypt", 1);
            if (id == 3) this.game.switchLevel("temple", 1);
            if (id == 5) this.game.switchLevel("ice", 1);
    },

    getLoot: function(id) {
            this.inherited(arguments);
            if (id == 1) this.game.getLoot(pocjs.entities.Item.cutters);
    }
});

dojo.provide("pocjs.level.StartLevel");

dojo.declare("pocjs.level.StartLevel", pocjs.level.Level, {
    constructor: function() {
        this.name = "The Prison";
    },

    decorateBlock: function(x, y, block, col) {
        this.inherited(arguments);
    },

    getNewBlock: function(x, y, col) {
        return this.inherited(arguments);
    },

    switchLevel: function(id) {
            if (id == 1) this.game.switchLevel("overworld", 1);
            if (id == 2) this.game.switchLevel("dungeon", 1);
    },

    getLoot: function(id) {
        this.inherited(arguments);
    }
});
dojo.provide("pocjs.level.TempleLevel");

dojo.declare("pocjs.level.TempleLevel", pocjs.level.Level, {
    triggerMask: 0,

    constructor: function() {
        this.floorCol = 0x8A6496;
        this.ceilCol = 0x8A6496;
        this.wallCol = 0xCFADDB;
        this.name = "The Temple";
    },

    switchLevel: function(id) {
        if (id == 1) this.game.switchLevel("overworld", 3);
    },

    getLoot: function(id) {
        this.inherited(arguments);
        if (id == 1) this.game.getLoot(pocjs.entities.Item.skates);
    },

    trigger: function(id, pressed) {
        this.triggerMask |= 1 << id;
        this.inherited(arguments);
        if (!pressed) this.triggerMask ^= 1 << id;

        if (this.triggerMask == 14) {
                this.inherited(arguments, [1, true]);
        } else {
                this.inherited(arguments, [1, false]);
        }
    }
});
dojo.provide("pocjs.Game");

dojo.declare("pocjs.Game", null,  {
    time: null,
    level: null,
    player: null,
    pauseTime: null,
    menu: null,

    constructor: function() {
        this.setMenu(new pocjs.menu.TitleMenu());
    },

    newGame: function() {
        pocjs.level.Level.clear();
        this.level = pocjs.level.Level.loadLevel(this, "start");
        this.player = new pocjs.entities.Player();
        this.player.level = this.level;
        this.level.player = this.player;
        this.player.x = this.level.xSpawn;
        this.player.z = this.level.ySpawn;
        this.level.addEntity(this.player);
        this.player.rot = Math.PI + 0.4;
    },


    switchLevel: function(name, id) {
        this.pauseTime = 30;
        this.level.removeEntityImmediately(this.player);
        this.level = pocjs.level.Level.loadLevel(this, name);
        this.level.findSpawn(id);
        this.player.x = this.level.xSpawn;
        this.player.z = this.level.ySpawn;
        this.level.getBlock(this.level.xSpawn, this.level.ySpawn).wait = true;
        this.player.x += Math.sin(this.player.rot) * 0.2;
        this.player.z += Math.cos(this.player.rot) * 0.2;
        this.level.addEntity(this.player);
    },

    tick: function(keys) {
	if (this.pauseTime > 0) {
	    this.pauseTime--;
	    return;
	}

        var kmap = {
            w: "W".charCodeAt(),
            s: "S".charCodeAt(),
            a: "A".charCodeAt(),
            d: "D".charCodeAt(),
            q: "Q".charCodeAt(),
            e: "E".charCodeAt()
        };

	this.time++;

        var dk = dojo.keys;

	var strafe = keys[dk.CTRL] || keys[dk.ALT] || keys[dk.META] || keys[dk.SHIFT];

	var lk = keys[dk.LEFT_ARROW] || keys[dk.NUMPAD_4];
	var rk = keys[dk.RIGHT_ARROW] || keys[dk.NUMPAD_6];

	var up = keys[kmap.w] || keys[dk.UP_ARROW] || keys[dk.NUMPAD_8];
	var down = keys[kmap.s] || keys[dk.DOWN_ARROW] || keys[dk.NUMPAD_2];

        var left = keys[kmap.a] || (strafe && lk);
	var right = keys[kmap.d] || (strafe && rk);

	var turnLeft = keys[kmap.q] || (!strafe && lk);
	var turnRight = keys[kmap.e] || (!strafe && rk);

	var use = keys[dk.SPACE];

	for (var i = 0; i < 8; i++) {
	    if (keys["1".charCodeAt() + i]) {
		keys["1".charCodeAt() + i] = false;
		this.player.selectedSlot = i;
		this.player.itemUseTime = 0;
	    }
	}

	if (keys[dk.ESCAPE]) {
	    keys[dk.ESCAPE] = false;
	    if (this.menu == null) {
		this.setMenu(new pocjs.menu.PauseMenu());
	    }
	}

	if (use) {
	    keys[dk.SPACE] = false;
	}

	if (this.menu != null) {
	    keys[kmap.w] = keys[dk.UP_ARROW] = keys[dk.NUMPAD_8] = false;
	    keys[kmap.s] = keys[dk.DOWN_ARROW] = keys[dk.NUMPAD_2] = false;
            keys[kmap.a] = false;
            keys[kmap.d] = false;

	    this.menu.tick(this, up, down, left, right, use);
	}
        else {
	    this.player.tick(up, down, left, right, turnLeft, turnRight);
	    if (use) {
		this.player.activate();
            }

	    this.level.tick();
	}
    },

    getLoot: function(item) {
	this.player.addLoot(item);
    },

    win: function(player) {
	this.setMenu(new pocjs.menu.WinMenu(player));
    },

    setMenu: function(menu) {
	this.menu = menu;
    },

    lose: function(player) {
        this.setMenu(new pocjs.menu.LoseMenu(player));
    }
});
dojo.provide("pocjs.gui.Screen");

dojo.declare("pocjs.gui.Screen", pocjs.gui.Bitmap, {
    PANEL_HEIGHT: 29,

    viewport: null,
    time: null,


    //"-chains-": {constructor: "manual"},
    constructor: function(width, height) {
        //this.inherited(arguments);

        this.viewport = new pocjs.gui.Bitmap3D(width, height - this.PANEL_HEIGHT);
    },

    render: function(game) {
        if (game.level == null) {
            this.fill(0, 0, this.width, this.height, 0);
        } else {
            var itemUsed = game.player.itemUseTime > 0;
            var item = game.player.items[game.player.selectedSlot];

            if (game.pauseTime > 0) {
                this.fill(0, 0, this.width, this.height, 0);
                var messages = [ "Entering " + game.level.name ];
                for (var y = 0; y < messages.length; y++) {
                    this.drawString(
                            messages[y], 
                            (this.width - messages[y].length * 6) / 2,
                            (this.viewport.height - messages.length * 8) / 2 + y * 8 + 1,
                            0x111111);
                    this.drawString(
                            messages[y],
                            (this.width - messages[y].length * 6) / 2,
                            (this.viewport.height - messages.length * 8) / 2 + y * 8,
                            0x555544);
                }
            } else {
                this.viewport.render(game);
                this.viewport.postProcess(game.level);

                var block = game.level.getBlock(
                        (game.player.x + 0.5) << 0, 
                        (game.player.z + 0.5) << 0
                );
                if (block.messages != null) {
                    for (var y = 0; y < block.messages.length; y++) {
                        this.viewport.drawPart(
                                block.messages[y],
                                (this.width - block.messages[y].length * 6) / 2,
                                (this.viewport.height - block.messages.length * 8) / 2 + y * 8 + 1,
                                0x111111);
                        this.viewport.drawPart(
                                block.messages[y],
                                (this.width - block.messages[y].length * 6) / 2, 
                                (this.viewport.height - block.messages.length * 8) / 2 + y * 8,
                                0x555544);
                    }
                }

                this.draw(this.viewport, 0, 0);
                var xx = (game.player.turnBob * 32) << 0 ;
                var yy = (Math.sin(game.player.bobPhase * 0.4) * 1 * game.player.bob + game.player.bob * 2) << 0;

                if (itemUsed) xx = yy = 0;
                xx += (this.width / 2 << 0);
                yy += (this.height - this.PANEL_HEIGHT - 15 * 3);
                if (item != pocjs.entities.Item.none) {
                    this.scaleDraw(pocjs.Art.items, 3, xx, yy, 16 * item.icon + 1, 16 + 1 + (itemUsed ? 16 : 0), 15, 15, pocjs.Art.getCol(item.color));
                }

                if (game.player.hurtTime > 0 || game.player.dead) {
                    var offs = 1.5 - game.player.hurtTime / 30.0;
                    if (game.player.dead) offs = 0.5;
                    for (var i = 0; i < this.pixels.length; i++) {
                        var xp = ((i % this.width) - this.viewport.width / 2.0) / this.width * 2;
                        var yp = ((i / this.width) - this.viewport.height / 2.0) / this.viewport.height * 2;

                        if (Math.random() + offs < Math.sqrt(xp * xp + yp * yp)) this.pixels[i] = Math.floor(Math.floor(Math.random() * 5)  / 4) * 0x550000;
                    }
                }
            }

            this.drawPart(pocjs.Art.panel, 0, this.height - this.PANEL_HEIGHT, 0, 0, this.width, this.PANEL_HEIGHT, pocjs.Art.getCol(0x707070));

            this.drawString("Â", 3, this.height - 26 + 0, 0x00ffff);
            this.drawString("" + game.player.keys + "/4", 10, this.height - 26 + 0, 0xffffff);
            this.drawString("ƒ", 3, this.height - 26 + 8, 0xffff00);
            this.drawString("" + game.player.loot, 10, this.height - 26 + 8, 0xffffff);
            this.drawString("≈", 3, this.height - 26 + 16, 0xff0000);
            this.drawString("" + game.player.health, 10, this.height - 26 + 16, 0xffffff);

            for (var i = 0; i < 8; i++) {
                var slotItem = game.player.items[i];
                if (slotItem != pocjs.entities.Item.none) {
                    this.drawPart(pocjs.Art.items, 30 + i * 16, this.height - this.PANEL_HEIGHT + 2, slotItem.icon * 16, 0, 16, 16, pocjs.Art.getCol(slotItem.color));
                    if (slotItem == pocjs.entities.Item.pistol) {
                        var str = "" + game.player.ammo;
                        this.drawString(str, 30 + i * 16 + 17 - str.length * 6, this.height - this.PANEL_HEIGHT + 1 + 10, 0x555555);
                    }
                    if (slotItem == pocjs.entities.Item.potion) {
                        var str = "" + game.player.potions;
                        this.drawString(str, 30 + i * 16 + 17 - str.length * 6, this.height - this.PANEL_HEIGHT + 1 + 10, 0x555555);
                    }
                }
            }

            this.drawPart(pocjs.Art.items, 30 + game.player.selectedSlot * 16, this.height - this.PANEL_HEIGHT + 2, 0, 48, 17, 17, pocjs.Art.getCol(0xffffff));

            this.drawString(item.name, 26 + (8 * 16 - item.name.length * 4) / 2, this.height - 9, 0xffffff);
        }

        if (game.menu != null) {
            for (var i = 0; i < this.pixels.length; i++) {
                this.pixels[i] = (this.pixels[i] & 0xfcfcfc) >> 2;
            }			
            game.menu.render(this);
        }

    }
});

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
        dojo.create('button', {
            onclick: 'pocjs.__game.stop();',
            innerHTML: 'Stop wild JS'
        }, dojo.body());

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
            var fps = this.frames / passedTime <<0;
            dojo.byId('status').innerHTML = "" + fps + " FPS";
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
