/// <reference path="references.ts" />

namespace ImageResizer {
    /**
     * Default options
     */
    var _defaults:Options = {
        maxWidth:         500,   // px
        maxHeight:        500,   // px
        resize:           true,  // Set to false to just set jpg-quality
        jpgQuality:       0.9,   // 0-1
        returnFileObject: true,  // Returns a file-object if browser support. Set to false to always return blob.
        upscale:          false, // Set to true to upscale the image if smaller than maxDimensions
        debug:            false, // Set to true to see console.log's
        renameFile:       true   // Renames the file to filename_resized.jpg / filename_compressed.jpg / filename_resized_compressed.jpg. Only works with File object.
    };

    /**
     * Resize an image and set jpg-quality
     *
     * @see https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
     */
    export function resizeImage(file, options, callbackFn) {
        if(!Modernizr.blobconstructor) {
            if(options.debug)
                console.info('Blob constructor not supported by this browser. Can\'t resize or compress image.');

            // Return original file
            callbackFn(file);
            return;
        }

        if(!Modernizr.canvas) {
            if(options.debug)
                console.info('Canvas 2D drawing not supported by this browser. Can\'t resize or compress image.');

            // Return original file
            callbackFn(file);
            return;
        }

        if(options.debug)
            console.log('Processing image: \'' + file.name + '\'');

        // Extend defaults with options
        var settings:Options = _extend({}, _defaults, options);

        // Error handling
        errorHandling(settings);

        // Create image from file
        var img = document.createElement('img');

        img.onload = () => {
            var width      = img.width;
            var height     = img.height;

            // Cache values for console.log
            var width_old  = width;
            var height_old = height;

            var resized = false;
            var _file;

            if(settings.resize) {
                if (width > height) {
                    if (width > settings.maxWidth || settings.upscale) {
                        height = Math.round(height * settings.maxWidth / width);
                        width  = settings.maxWidth;

                        resized = true;
                    }
                } else {
                    if (height > settings.maxHeight || settings.upscale) {
                        width  = Math.round(width * settings.maxHeight / height);
                        height = settings.maxHeight;

                        resized = true;
                    }
                }
            }

            if(resized || settings.jpgQuality != 1) {
                // Create canvas
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");

                // Draw image
                canvas.width  = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Get Data-URL and set image quality
                var dataURL = canvas.toDataURL("image/jpeg", settings.jpgQuality);
                
                // Get Blob
                var blob = _dataURLToBlob(dataURL);

                if(options.debug) {
                    console.log('Setting jpeg-quality to: ' + settings.jpgQuality);
                    console.log((resized? 'Resizing from ' + width_old + 'x' + height_old + 'px to ' + width + 'x' + height + 'px' : 'Resizing not required. Image smaller than max dimensions or resizing disabled.'));
                }

                if(Modernizr.filesystem && settings.returnFileObject) {
                    // Return File-object
                    var fileName;
                    if(settings.renameFile) {
                        var name      = file.name.replace(/\.[^/.]+$/, "");
                         fileName = name + (resized? '_resized' : '') + (settings.jpgQuality != 1? '_compressed' : '') + '.jpg';
                    } else {
                        fileName = file.name;
                    }

                    if(options.debug)
                        console.log('Renamed file from \'' + file.name + '\' to \'' + fileName + '\'');

                    var newFile = new File([blob], fileName, { type: blob.type, lastModified: (new Date()).getTime() });

                    if(options.debug)
                        console.log(
                            'Returning File object: \n' +
                            '  name: '             + newFile.name             + '\n' +
                            '  lastModified: '     + newFile.lastModifiedDate + '\n' +
                            '  size: '             + newFile.size             + '\n' +
                            '  type: '             + newFile.type
                        );
                    
                    callbackFn(newFile);
                } else {
                    if(!Modernizr.filesystem && options.debug)
                        console.info('Browser doesn\'t support File API');

                    if(options.debug)
                        console.log(
                            'Returning Blob object:\n' +
                            '  size: '             + blob.size + '\n' +
                            '  type: '             + blob.type
                        );

                    // Return Blob
                    callbackFn(blob);
                }
            } else {
                if(options.debug)
                    console.log('Image smaller than max-dimensions');

                // Return original file
                callbackFn(file);
            }
        };

        img.src = window.URL.createObjectURL(file);
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
     */
    function errorHandling(settings) {
        if(settings.jpgQuality < 0 || settings.jpgQuality > 1)
            console.error('Option jpgQuality must be between 0 and 1');
    }
}