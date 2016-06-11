/// <reference path="references.ts" />

namespace ImageResizer {
    /**
     * Default options
     */
    var _defaults:Options = {
        maxWidth:         500,   // px
        maxHeight:        500,   // px
        resize:           true,  // Set to false to just set jpg-quality
        sharpen:          0.15,  // 0-1
        jpgQuality:       0.9,   // 0-1
        returnFileObject: true,  // Returns a file-object if browser support. Set to false to always return blob.
        upscale:          false, // Set to true to upscale the image if smaller than maxDimensions
        debug:            false, // Set to true to see console.log's
        renameFile:       true   // Renames the file to filename_resized.jpg / filename_compressed.jpg / filename_resized_compressed.jpg. Only works with File object.
    };

    /**
     * Resize image, sharpen and set jpg-quality
     *
     * @see https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
     * @see http://stackoverflow.com/a/19262385/5688490
     * @see http://stackoverflow.com/a/19235791/5688490
     * @see http://stackoverflow.com/a/19262385/5688490
     */
    export function resizeImage(file, options, callbackFn) {
        if(!Modernizr.blobconstructor) {
            if(options.debug)
                console.info('Blob constructor not supported by this browser. Can\'t resize or compress image.');

            // Return original File object
            callbackFn(file);
            return;
        }

        if(!Modernizr.canvas) {
            if(options.debug)
                console.info('Canvas 2D drawing not supported by this browser. Can\'t resize or compress image.');

            // Return original File object
            callbackFn(file);
            return;
        }

        // Error handling
        if(_errorHandling(options))
            return;

        if(options.debug)
            console.log('Processing image: \'' + file.name + '\'');

        // Extend defaults with options
        var settings:Options = _extend({}, _defaults, options);

        // Create image
        var img = document.createElement('img');

        img.onload = () => {
            var width,  width_original;
            var height, height_original;

            width  = width_original  = img.width;
            height = height_original = img.height;

            var resize = false;

            if(settings.resize) {
                // Calculate new image-size
                if (width > height) {
                    if (width > settings.maxWidth || settings.upscale) {
                        height = Math.round(height * settings.maxWidth / width);
                        width  = settings.maxWidth;

                        resize = true;
                    }
                } else {
                    if (height > settings.maxHeight || settings.upscale) {
                        width  = Math.round(width * settings.maxHeight / height);
                        height = settings.maxHeight;

                        resize = true;
                    }
                }
            }

            console.log((resize? 'Resizing from ' + width_original + 'x' + height_original + 'px to ' + width + 'x' + height + 'px' : 'Resizing not required. Image smaller than max dimensions or resizing disabled.'));

            if(resize || settings.jpgQuality != 1) {
                // Create canvas
                var canvas     = document.createElement("canvas");
                var ctx        = canvas.getContext("2d");
                canvas.width   = width;
                canvas.height  = height;

                // Calculate steps needed for down-scaling
                var steps;

                if(width > height) {
                    steps = Math.ceil(Math.log(img.width  / width)  / Math.log(2));
                } else {
                    steps = Math.ceil(Math.log(img.height / height) / Math.log(2));
                }

                if(steps > 1) {
                    var oc   = document.createElement('canvas'),
                        octx = oc.getContext('2d');

                    var widthTmp, heightTmp;

                    // Down-scaling step 1
                    oc.width  = widthTmp  = img.width  * 0.5;
                    oc.height = heightTmp = img.height * 0.5;
                    octx.drawImage(img, 0, 0, oc.width, oc.height);

                    for(var i=2; i<steps; i++) {
                        // Down-scaling step i
                        widthTmp  *= 0.5;
                        heightTmp *= 0.5;
                        octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);
                    }

                    // Draw final result (down-scaling step i+1)
                    ctx.drawImage(oc, 0, 0, widthTmp, heightTmp, 0, 0, canvas.width, canvas.height);
                } else {
                    // Draw final result (down-scaling step 1 of 1)
                    ctx.drawImage(img, 0, 0, width, height);
                }

                // Sharpen
                if(settings.sharpen > 0) {
                    if(options.debug)
                        console.log('Sharpening image ' + (settings.sharpen *100) + '%');

                    _sharpen(ctx, canvas.width, canvas.height, settings.sharpen);
                }

                if(options.debug) {
                    console.log('Setting jpeg-quality to: ' + settings.jpgQuality);
                }

                // Get Data-URL and set image quality
                var dataURL = canvas.toDataURL("image/jpeg", settings.jpgQuality);
                
                // Get Blob
                var blob = _dataURLToBlob(dataURL);

                // Return File- or Blob-Object
                if(Modernizr.filesystem && settings.returnFileObject) {
                    // Return File-object
                    var fileName;

                    if(settings.renameFile) {
                        var name = file.name.replace(/\.[^/.]+$/, "");
                        fileName = name + (resize? '_resized' : '') + (settings.jpgQuality != 1? '_compressed' : '') + '.jpg';

                        if(options.debug)
                            console.log('Renaming file from \'' + file.name + '\' to \'' + fileName + '\'');
                    } else {
                        fileName = file.name;
                    }

                    var newFile = new File([blob], fileName, { type: blob.type, lastModified: (new Date()).getTime() });

                    if(options.debug)
                        console.log(
                            'Finished processing. Returning File object: \n' +
                            '  name: '             + newFile.name             + '\n' +
                            '  lastModified: '     + newFile.lastModifiedDate + '\n' +
                            '  size: '             + newFile.size             + '\n' +
                            '  type: '             + newFile.type
                        );

                    // Return File object
                    callbackFn(newFile);
                } else {
                    if(!Modernizr.filesystem && options.debug)
                        console.info('Browser doesn\'t support File API');

                    if(options.debug)
                        console.log(
                            'Finished processing. Returning Blob object:\n' +
                            '  size: '             + blob.size + '\n' +
                            '  type: '             + blob.type
                        );

                    // Return Blob object
                    callbackFn(blob);
                }
            } else {
                if(options.debug)
                    console.log('Image smaller than max-dimensions');

                // Return original File object
                callbackFn(file);
            }
        };

        img.src = window.URL.createObjectURL(file);
    }

    /**
     * Sharpen image
     *
     * @see http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
     * @see http://stackoverflow.com/questions/18922880/html5-canvas-resize-downscale-image-high-quality/19235791#19235791
     */
     function _sharpen(ctx, w, h, mix) {
        var weights =  [0, -1, 0,  -1, 5, -1,  0, -1, 0],
            katet = Math.round(Math.sqrt(weights.length)),
            half = (katet * 0.5) |0,
            dstData = ctx.createImageData(w, h),
            dstBuff = dstData.data,
            srcBuff = ctx.getImageData(0, 0, w, h).data,
            y = h;

        while(y--) {
            var x = w;

            while(x--) {

                var sy = y,
                    sx = x,
                    dstOff = (y * w + x) * 4,
                    r = 0, g = 0, b = 0, a = 0;

                for (var cy = 0; cy < katet; cy++) {
                    for (var cx = 0; cx < katet; cx++) {

                        var scy = sy + cy - half;
                        var scx = sx + cx - half;

                        if (scy >= 0 && scy < h && scx >= 0 && scx < w) {

                            var srcOff = (scy * w + scx) * 4;
                            var wt = weights[cy * katet + cx];

                            r += srcBuff[srcOff] * wt;
                            g += srcBuff[srcOff + 1] * wt;
                            b += srcBuff[srcOff + 2] * wt;
                            a += srcBuff[srcOff + 3] * wt;
                        }
                    }
                }

                dstBuff[dstOff] = r * mix + srcBuff[dstOff] * (1 - mix);
                dstBuff[dstOff + 1] = g * mix + srcBuff[dstOff + 1] * (1 - mix);
                dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix)
                dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
            }
        }

        ctx.putImageData(dstData, 0, 0);
    }

    /**
     * Data-URL to Blob
     *
     * @see https://github.com/ebidel/filer.js/blob/master/src/filer.js#L137
     */
    function _dataURLToBlob(dataURL): Blob {
        var BASE64_MARKER = ';base64,';
        if (dataURL.indexOf(BASE64_MARKER) == -1) {
            var parts = dataURL.split(',');
            var contentType = parts[0].split(':')[1];
            var raw = decodeURIComponent(parts[1]);

            return new Blob([raw], {type: contentType});
        }

        var parts = dataURL.split(BASE64_MARKER);
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;

        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], {type: contentType});
    }

    /**
     * Mimic jQuery.extend
     *
     * @see http://stackoverflow.com/a/11197343/5688490
     */
    function _extend(obj, def, config) {
        for(var i=1; i<arguments.length; i++)
            for(var key in arguments[i])
                if(arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[i][key];
        return arguments[0];
    }

    /**
     * Handle some errors with incorrect options
     *
     * Returns true, if there was an error
     */
    function _errorHandling(settings):boolean {
        if(settings.jpgQuality < 0 || settings.jpgQuality > 1) {
            console.error('Option \'jpgQuality\' must be between 0 and 1');
            return true;
        }

        if(settings.sharpen < 0 || settings.sharpen > 1) {
            console.error('Option \'sharpen\' must be between 0 and 1');
            return true;
        }
    }
}