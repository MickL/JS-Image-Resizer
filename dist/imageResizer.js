var ImageResizer;
(function (ImageResizer) {
    var _defaults = {
        maxWidth: 500,
        maxHeight: 500,
        resize: true,
        sharpen: 0.1,
        jpgQuality: 0.9,
        returnFileObject: true,
        upscale: false,
        debug: false,
        renameFile: true
    };
    function resizeImage(file, options, callbackFn) {
        if (!Modernizr.blobconstructor) {
            if (options.debug)
                console.info('Blob constructor not supported by this browser. Can\'t resize or compress image.');
            callbackFn(file);
            return;
        }
        if (!Modernizr.canvas) {
            if (options.debug)
                console.info('Canvas 2D drawing not supported by this browser. Can\'t resize or compress image.');
            callbackFn(file);
            return;
        }
        if (options.debug)
            console.log('Processing image: \'' + file.name + '\'');
        var settings = _extend({}, _defaults, options);
        errorHandling(settings);
        var img = document.createElement('img');
        img.onload = function () {
            var width = img.width;
            var height = img.height;
            var width_old = width;
            var height_old = height;
            var resized = false;
            var _file;
            if (settings.resize) {
                if (width > height) {
                    if (width > settings.maxWidth || settings.upscale) {
                        height = Math.round(height * settings.maxWidth / width);
                        width = settings.maxWidth;
                        resized = true;
                    }
                }
                else {
                    if (height > settings.maxHeight || settings.upscale) {
                        width = Math.round(width * settings.maxHeight / height);
                        height = settings.maxHeight;
                        resized = true;
                    }
                }
            }
            if (resized || settings.jpgQuality != 1) {
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                canvas.width = width;
                canvas.height = height;
                var oc = document.createElement('canvas'), octx = oc.getContext('2d');
                oc.width = img.width * 0.5;
                oc.height = img.height * 0.5;
                octx.drawImage(img, 0, 0, oc.width, oc.height);
                octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);
                ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5, 0, 0, canvas.width, canvas.height);
                if (settings.sharpen > 0) {
                    if (options.debug)
                        console.log('Sharpening image ' + (settings.sharpen * 100) + '%');
                    _sharpen(ctx, canvas.width, canvas.height, settings.sharpen);
                }
                var dataURL = canvas.toDataURL("image/jpeg", settings.jpgQuality);
                var blob = _dataURLToBlob(dataURL);
                if (options.debug) {
                    console.log('Setting jpeg-quality to: ' + settings.jpgQuality);
                    console.log((resized ? 'Resizing from ' + width_old + 'x' + height_old + 'px to ' + width + 'x' + height + 'px' : 'Resizing not required. Image smaller than max dimensions or resizing disabled.'));
                }
                if (Modernizr.filesystem && settings.returnFileObject) {
                    var fileName;
                    if (settings.renameFile) {
                        var name = file.name.replace(/\.[^/.]+$/, "");
                        fileName = name + (resized ? '_resized' : '') + (settings.jpgQuality != 1 ? '_compressed' : '') + '.jpg';
                    }
                    else {
                        fileName = file.name;
                    }
                    if (options.debug)
                        console.log('Renamed file from \'' + file.name + '\' to \'' + fileName + '\'');
                    var newFile = new File([blob], fileName, { type: blob.type, lastModified: (new Date()).getTime() });
                    if (options.debug)
                        console.log('Finished processing. Returning File object: \n' +
                            '  name: ' + newFile.name + '\n' +
                            '  lastModified: ' + newFile.lastModifiedDate + '\n' +
                            '  size: ' + newFile.size + '\n' +
                            '  type: ' + newFile.type);
                    callbackFn(newFile);
                }
                else {
                    if (!Modernizr.filesystem && options.debug)
                        console.info('Browser doesn\'t support File API');
                    if (options.debug)
                        console.log('Finished processing. Returning Blob object:\n' +
                            '  size: ' + blob.size + '\n' +
                            '  type: ' + blob.type);
                    callbackFn(blob);
                }
            }
            else {
                if (options.debug)
                    console.log('Image smaller than max-dimensions');
                callbackFn(file);
            }
        };
        img.src = window.URL.createObjectURL(file);
    }
    ImageResizer.resizeImage = resizeImage;
    function _sharpen(ctx, w, h, mix) {
        var weights = [0, -1, 0, -1, 5, -1, 0, -1, 0], katet = Math.round(Math.sqrt(weights.length)), half = (katet * 0.5) | 0, dstData = ctx.createImageData(w, h), dstBuff = dstData.data, srcBuff = ctx.getImageData(0, 0, w, h).data, y = h;
        while (y--) {
            var x = w;
            while (x--) {
                var sy = y, sx = x, dstOff = (y * w + x) * 4, r = 0, g = 0, b = 0, a = 0;
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
                dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix);
                dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
            }
        }
        ctx.putImageData(dstData, 0, 0);
    }
    function _dataURLToBlob(dataURL) {
        var BASE64_MARKER = ';base64,';
        if (dataURL.indexOf(BASE64_MARKER) == -1) {
            var parts = dataURL.split(',');
            var contentType = parts[0].split(':')[1];
            var raw = decodeURIComponent(parts[1]);
            return new Blob([raw], { type: contentType });
        }
        var parts = dataURL.split(BASE64_MARKER);
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);
        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    }
    function _extend(obj, def, config) {
        for (var i = 1; i < arguments.length; i++)
            for (var key in arguments[i])
                if (arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[i][key];
        return arguments[0];
    }
    function errorHandling(settings) {
        if (settings.jpgQuality < 0 || settings.jpgQuality > 1)
            console.error('Option jpgQuality must be between 0 and 1');
        if (settings.sharpen < 0 || settings.sharpen > 1)
            console.error('Option sharpen must be between 0 and 1');
    }
})(ImageResizer || (ImageResizer = {}));
//# sourceMappingURL=imageResizer.js.map