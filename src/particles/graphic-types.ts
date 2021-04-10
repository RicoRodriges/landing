interface Drawable {
    getTriangleCount(): number;

    writeTriangles(buf: Float32Array, offset: number): void;
}

export class Line implements Drawable {
    constructor(protected x1: number, protected y1: number,
                protected x2: number, protected y2: number,
                protected width: number) {
    }

    getTriangleCount(): number {
        return 2;
    }

    writeTriangles(buf: Float32Array, offset: number): void {
        // Triangle 1
        buf[offset + 0] = this.x1 - this.width / 2;
        buf[offset + 1] = this.y1 - this.width / 2;
        buf[offset + 2] = this.x2 - this.width / 2;
        buf[offset + 3] = this.y2 - this.width / 2;
        buf[offset + 4] = this.x2 + this.width / 2;
        buf[offset + 5] = this.y2 + this.width / 2;

        // Triangle 2
        buf[offset + 6] = this.x1 + this.width / 2;
        buf[offset + 7] = this.y1 + this.width / 2;
        buf[offset + 8] = this.x1 - this.width / 2;
        buf[offset + 9] = this.y1 - this.width / 2;
        buf[offset + 10] = this.x2 + this.width / 2;
        buf[offset + 11] = this.y2 + this.width / 2;
    }
}

export class Point implements Drawable {
    constructor(protected x: number, protected y: number, protected width: number = 10) {
    }

    getTriangleCount(): number {
        return 2;
    }

    writeTriangles(buf: Float32Array, offset: number): void {
        // Triangle 1
        buf[offset + 0] = this.x - this.width / 2;
        buf[offset + 1] = this.y;
        buf[offset + 2] = this.x;
        buf[offset + 3] = this.y - this.width / 2;
        buf[offset + 4] = this.x;
        buf[offset + 5] = this.y + this.width / 2;

        // Triangle 2
        buf[offset + 6] = this.x + this.width / 2;
        buf[offset + 7] = this.y;
        buf[offset + 8] = this.x;
        buf[offset + 9] = this.y - this.width / 2;
        buf[offset + 10] = this.x;
        buf[offset + 11] = this.y + this.width / 2;
    }
}
