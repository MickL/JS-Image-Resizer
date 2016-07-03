namespace ImageResizer {
    export interface Options {
        maxWidth:         number;
        maxHeight:        number;
        resize:           boolean;
        sharpen:          number;
        jpgQuality:       number;
        pngToJpg:         boolean;
        pngToJpgBgColor:  string;
        returnFileObject: boolean;
        upscale:          boolean;
        debug:            boolean;
        renameFile:       boolean;
    }
}