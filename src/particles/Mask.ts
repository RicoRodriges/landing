export default class Mask {

    mask: Int8Array | null = null;
    w = 0;
    h = 0;

    scaledW = 0;
    scaledH = 0;
    canvasW = 0;
    canvasH = 0;
    scale = 1;

    constructor(url: string) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = this.onMaskLoaded.bind(this, image);
        image.src = url;
    }

    updateScale(w: number, h: number) {
        if (!this.mask) {
            // mask isn't loaded yet
            return;
        }
        this.canvasW = w;
        this.canvasH = h;
        this.scale = Math.min(w / this.w, h / this.h);
        this.scaledW = this.w * this.scale;
        this.scaledH = this.h * this.scale;
    }

    private toMaskPixelCoordinate(x: number, y: number): [number, number] {
        let offsetX = Math.abs(this.scaledW - this.canvasW) / 2;
        let offsetY = Math.abs(this.scaledH - this.canvasH) / 2;
        if (offsetX > offsetY) {
            offsetY = 0;
        } else {
            offsetX = 0;
        }

        return [
            ((x - offsetX) / this.scale) | 0,
            ((y - offsetY) / this.scale) | 0,
        ];
    }

    isIntersect(x: number, y: number) {
        if (!this.mask) {
            // mask isn't loaded yet
            return true;
        }
        [x, y] = this.toMaskPixelCoordinate(x, y);
        return this.read(x, y);
    }

    isConnected(x1: number, y1: number, x2: number, y2: number) {
        if (!this.mask) {
            // mask isn't loaded yet
            return true;
        }
        [x1, y1] = this.toMaskPixelCoordinate(x1, y1);
        [x2, y2] = this.toMaskPixelCoordinate(x2, y2);

        if (x1 === x2) {
            const yFrom = Math.min(y1, y2);
            const yTo = Math.max(y1, y2);
            for (let y = yFrom; y <= yTo; ++y) {
                if (!this.read(x1, y)) return false;
            }
            return true;
        }

        // y = k*x + c
        const k = (y1 - y2) / (x1 - x2);
        const c = y1 - x1 * k;
        if (Math.abs(k) >= 1) {
            const yFrom = Math.min(y1, y2);
            const yTo = Math.max(y1, y2);
            for (let y = yFrom; y <= yTo; ++y) {
                if (!this.read(((y - c) / k) | 0, y)) return false;
            }
            return true;
        } else {
            const xFrom = Math.min(x1, x2);
            const xTo = Math.max(x1, x2);
            for (let x = xFrom; x <= xTo; ++x) {
                if (!this.read(x, (k * x + c) | 0)) return false;
            }
            return true;
        }
    }

    private read(x: number, y: number): boolean {
        if (this.mask) {
            if (x < this.w && y < this.h && x >= 0 && y >= 0) {
                const index = this.w * y + x;
                return this.mask[index] !== 0;
            }
            return false;
        }
        return true;
    }

    private write(x: number, y: number, val: boolean) {
        if (this.mask) {
            const index = this.w * y + x;
            this.mask[index] = val ? 1 : 0;
        }
    }

    private onMaskLoaded(img: HTMLImageElement) {
        const canvas = document.createElement('canvas');
        const w = this.w = canvas.width = img.width;
        const h = this.h = canvas.height = img.height;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const rgba = new Uint32Array(imgData.data.buffer); // RGBA - UInt32 pixel

        this.mask = new Int8Array(this.w * this.h);
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const val = (rgba[(imgData.width * y) + x] & 0x00FFFFFF) > 0;
                this.write(x, y, val);
            }
        }
    }
}
