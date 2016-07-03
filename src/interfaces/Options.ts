namespace ImageResizer {
    export interface Options {
        maxWidth:            number;
        maxHeight:           number;
        resize:              boolean;
        sharpen:             number;   
        jpgQuality:          number;
        convertToJpg:        boolean;
        convertToJpgBgColor: string;
        returnFileObject:    boolean;
        upscale:             boolean;
        debug:               boolean;
        renameFile:          boolean;
    }
}