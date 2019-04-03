### OUTDATED - Please use [ts-image-precessor](https://github.com/MickL/ts-image-precessor) instead!


# JavaScript image resizer
Resize images on client side, using plain JavaScript. Only 4KB minified and written in TypeScript.

This script offers smooth resizing by using multiple down-scaling steps(depending on source- and target-dimensions) and sharpen after resizing. You can also convert (transparent) png or svg to jpg, or (transparent) svg to (transparent) png.

Use this script e.g. if you want to resize images before upload or to display a thumbnail.

JS-ImageResizer returns a File-object if [File API](http://caniuse.com/#feat=fileapi) is available. Otherwise it returns a Blob. If [Blob constructor](http://caniuse.com/#feat=fileapi) or [Canvas 2D drawing](http://caniuse.com/#feat=canvas) is not available, it just returns the original file. Therefore it should be usable in all browsers. You can use either to display the image on your page or upload it.


## Demo
[JavaScript image resizer demo](http://www.lawitzke.com/demo/js-image-resizer)

## Usage
Because image.onload is used, the resizing works asynchronous. Hence you have to specify a callback function.
You can also change the jpg-quality only, without resizing the image by using the option `resize:false`.

You can convert png to jpg and set a background-color for transparent png, too.

**Usage:**

```
ImageResizer.resizeImage(file, options, function(resultFile) {
    // Do something with your file(resultFile), e.g. upload to server
});
```

or

```
ImageResizer.resizeImage(file, options, myCallbackFn);

var myCallbackFn = function(resultFile) {
    // Do something with your file(resultFile), e.g. upload to server
};
```

To only change jpg-quality, simply set options:
```
var options = {
    resize:          false,
    jpgQuality:      0.8
}
```

Or to only convert png/svg to jpg:
```
var options = {
    resize:              false,
    convertToJpg:        true,
    convertToJpgBgColor: "#FFFFFF" 
}
```

**Default options:**
```
{
    maxWidth:            500,       // px
    maxHeight:           500,       // px
    resize:              true,      // Set to false to just set jpg-quality
    sharpen:             0.15,      // 0-1
    jpgQuality:          0.9,       // 0-1, doesnt affect when pngToJpg == false
    convertToJpg:        false,     // Convert png/svg to jpg
    convertToJpgBgColor: "#FFFFFF", // Background color when converting transparent png/svg to jpg
    returnFileObject:    true,      // Returns a file-object if browser support. Set to false to always return blob.
    upscale:             false,     // Set to true to upscale the image if smaller than maxDimensions
    debug:               false,     // Set to true to see console.log's
    renameFile:          true       // Renames the file to filename_resized.jpg / filename_compressed.jpg / filename_resized_compressed.jpg. Only works with File object.
}
```

## Dependencies
- Modernizr, for feature-detection. [Preconfigured download](https://modernizr.com/download/?-blobconstructor-canvas-filereader-filesystem-setclasses)

## Contribution
Feel free to edit, extend, or improve the code. I will try to merge pull-requests as fast as possible.
You can report bugs or feature requests within GitHub Issues.

## Credits
Alot of code is proudly copied from StackOverflow and other sources. `@see` the comments within source code for resources. 

## Lincense
JS-ImageResizer is released under the [MIT License](https://ben.mit-license.org/)
