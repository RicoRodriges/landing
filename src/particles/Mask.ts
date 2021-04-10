export default class Mask {

    mask: Int8Array | null = null;
    w = 0;
    h = 0;

    constructor(url: string) {
        const image = new Image();
        // image.crossOrigin = "anonymous";
        image.onload = this.onMaskLoaded.bind(this, image);
        image.src = url;
    }

    isIntersect(x: number, y: number, w: number, h: number) {
        if (!this.mask) {
            // mask isn't loaded yet
            return true;
        }
        const normalizer = this.calcMaskPixelSize(w, h);
        let offsetX, offsetY;
        if (Math.abs(normalizer * this.w - w) > Math.abs(normalizer * this.h - h)) {
            offsetX = Math.abs(normalizer * this.w - w) / 2;
            offsetY = 0;
        } else {
            offsetX = 0;
            offsetY = Math.abs(normalizer * this.h - h) / 2;
        }
        x = ((x - offsetX) / normalizer) | 0;
        y = ((y - offsetY) / normalizer) | 0;
        return this.read(x, y);
    }

    isConnected(x1: number, y1: number, x2: number, y2: number, w: number, h: number) {
        if (!this.mask) {
            // mask isn't loaded yet
            return true;
        }

        const pixelSize = this.calcMaskPixelSize(w, h);

        if (y1 == y2) {
            // TODO: implement
            return false;
        }

        // y = k*x + c
        const k = (y1 - y2) / (x1 - x2);
        const c = y1 - x1 * k;

        const yStep = (y1 > y2) ? -pixelSize : pixelSize;
        for (let y = y1; (yStep > 0) ? (y < y2 + yStep) : (y > y2 + yStep); y += yStep) {
            const yNext = (yStep < 0) ? Math.max(y + yStep, y2) : Math.min(y + yStep, y2);
            const xl = (y - c) / k;
            const xr = (yNext - c) / k;

            const yBorder = ((y / pixelSize) | 0) + 1;

            const xBorder = yBorder * k + c;

            const xStep = (xl > xr) ? -pixelSize : pixelSize;
            if ((xStep >= 0 && xl >= xBorder && xr <= xBorder) || (xStep < 0 && xl <= xBorder && xr >= xBorder)) {
                if (!this.isIntersect(xBorder - 1, (xBorder - 1) * k + c, w, h) || !this.isIntersect(xBorder + 1, (xBorder + 1) * k + c, w, h)) {
                    return false;
                }
            }
            for (let x = xl; (xStep > 0) ? (x < xr + xStep) : (x > xr + xStep); x += xStep) {
                if (!this.isIntersect(x, x * k + c, w, h)) {
                    return false;
                }
            }
        }
        return true;
    }

    // isConnected(x1: number, y1: number, x2: number, y2: number, w: number, h: number) {
    //     if (!this.mask) {
    //         // mask isn't loaded yet
    //         return true;
    //     }
    //
    //     if (x1 > x2) {
    //         const temp = x1;
    //         x1 = x2;
    //         x2 = temp;
    //     }
    //     if (y1 > y2) {
    //         const temp = y1;
    //         y1 = y2;
    //         y2 = temp;
    //     }
    //     const pixelSize = this.calcMaskPixelSize(w, h);
    //
    //     for (let y = (y1 - y1 % pixelSize) | 0; y < ((y2 - y2 % pixelSize + 1) | 0); y += pixelSize) {
    //         for (let x = (x1 - x1 % pixelSize) | 0; x < ((x2 - x2 % pixelSize + 1) | 0); x += pixelSize) {
    //             if (!this.isIntersect(x, y, w, h)) {
    //                 return false;
    //             }
    //         }
    //     }
    //     return true;
    // }

    private read(x: number, y: number): boolean {
        if (this.mask) {
            if (x < this.w && y < this.h && x >= 0 && y >= 0) {
                const bitIndex = ((this.w * y) + x) | 0;
                const byteIndex = (bitIndex / 8) | 0;
                return (this.mask[byteIndex] & (1 << (bitIndex % 8))) != 0;
            }
            return false;
        }
        return true;
    }

    // private readMany(xFrom: number, xTo: number, y: number): boolean {
    //     if (this.mask) {
    //
    //         if (xFrom > xTo) {
    //             const temp = xTo;
    //             xFrom = xTo;
    //             xTo = temp;
    //         }
    //
    //         if (xFrom < this.w && y < this.h && xTo >= 0 && y >= 0) {
    //             xFrom = Math.max(xFrom, 0);
    //             xTo = Math.min(xTo, this.w - 1);
    //
    //             const indexFrom = ((this.w * y + xFrom) / 8) | 0;
    //             const indexTo = ((this.w * y + xTo) / 8) | 0;
    //             let bitStart = xFrom % 8;
    //             let bitEnd = xTo % 8;
    //             for (let i = indexFrom; i <= indexTo; ++i) {
    //                 let mask = 0xFF;
    //                 if (i == indexFrom || i == indexTo) {
    //                     const byteFrom = (i == indexFrom) ? xFrom % 8 : 0;
    //                     const byteTo = (i == indexTo) ? xTo % 8 : 7;
    //                 }
    //                 return (this.mask[i] & (1 << (bitIndex % 8))) != 0;
    //             }
    //         }
    //         return false;
    //     }
    //     return true;
    // }

    private write(x: number, y: number, val: boolean) {
        if (this.mask && x < this.w && y < this.h) {
            const bitIndex = ((this.w * y) + x) | 0;
            const byteIndex = (bitIndex / 8) | 0;
            if (val) {
                this.mask[byteIndex] = this.mask[byteIndex] | (1 << (bitIndex % 8));
            } else {
                this.mask[byteIndex] = this.mask[byteIndex] & ~(1 << (bitIndex % 8));
            }
        }
    }

    private calcMaskPixelSize(w: number, h: number) {
        const sizeW = w / this.w;
        const sizeH = h / this.h;
        return Math.min(sizeW, sizeH);
    }


    private onMaskLoaded(img: HTMLImageElement) {
        const canvas = document.createElement('canvas');
        this.w = canvas.width = img.width;
        this.h = canvas.height = img.height;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.mask = new Int8Array(new ArrayBuffer((this.w * this.h) / 8 + 1));
        for (let y = 0; y < imgData.height; ++y) {
            for (let x = 0; x < imgData.width; ++x) {
                const index = ((imgData.width * y) + x) * 4; // imgData.data
                const val = imgData.data[index] > 0 || imgData.data[index + 1] > 0 || imgData.data[index + 2] > 0;
                this.write(x, y, val);
            }
        }
    }
}
