
export interface TownObject {
    getTriangleCount(): number;
    writeTriangles(buf: Float32Array, offset: number): void;
    writeColors(buf: Uint8ClampedArray, offset: number): void;
    isStatic(): boolean;

    setOffsetX(offsetX: number): void;
    setOffsetY(offsetY: number): void;
}

export class House implements TownObject {
    offsetX = 0;
    offsetY = 0;

    setOffsetX(offsetX: number) {
        this.offsetX = offsetX;
    }
    setOffsetY(offsetY: number) {
        this.offsetY = offsetY;
    }

    constructor(public width: number, public height: number, public depth: number, public color: Color,
                public centerX: number, public centerY: number) {
    }

    getTriangleCount(): number {
        return 4;
    }

    isStatic(): boolean {
        return true;
    }

    writeColors(buf: Uint8ClampedArray, offset: number): void {
        // front
        for (let i = 0; i < 6; ++i) {
            buf[offset + i * 4] = this.color.r;
            buf[offset + i * 4 + 1] = this.color.g;
            buf[offset + i * 4 + 2] = this.color.b;
            buf[offset + i * 4 + 3] = this.color.a;
        }

        // right
        for (let i = 6; i < 12; ++i) {
            buf[offset + i * 4] = this.color.r + 20;
            buf[offset + i * 4 + 1] = this.color.g + 20;
            buf[offset + i * 4 + 2] = this.color.b + 20;
            buf[offset + i * 4 + 3] = this.color.a;
        }
    }

    writeTriangles(buf: Float32Array, offset: number): void {
        const leftX = this.centerX - this.width / 2 + this.offsetX;
        const rightX = this.centerX + this.width / 2 + this.offsetX;

        const frontY = this.centerY + this.depth / 2 + this.offsetY;
        const backY = this.centerY - this.depth / 2 + this.offsetY;

        // front rectangle
        buf[offset + 0] = leftX;
        buf[offset + 1] = frontY;
        buf[offset + 2] = 0;

        buf[offset + 3] = rightX;
        buf[offset + 4] = frontY;
        buf[offset + 5] = 0;

        buf[offset + 6] = rightX;
        buf[offset + 7] = frontY;
        buf[offset + 8] = this.height;

        buf[offset + 9] = rightX;
        buf[offset + 10] = frontY;
        buf[offset + 11] = this.height;

        buf[offset + 12] = leftX;
        buf[offset + 13] = frontY;
        buf[offset + 14] = this.height;

        buf[offset + 15] = leftX;
        buf[offset + 16] = frontY;
        buf[offset + 17] = 0;

        // right rectangle
        buf[offset + 18] = rightX;
        buf[offset + 19] = frontY;
        buf[offset + 20] = 0;

        buf[offset + 21] = rightX;
        buf[offset + 22] = backY;
        buf[offset + 23] = 0;

        buf[offset + 24] = rightX;
        buf[offset + 25] = backY;
        buf[offset + 26] = this.height;

        buf[offset + 27] = rightX;
        buf[offset + 28] = backY;
        buf[offset + 29] = this.height;

        buf[offset + 30] = rightX;
        buf[offset + 31] = frontY;
        buf[offset + 32] = this.height;

        buf[offset + 33] = rightX;
        buf[offset + 34] = frontY;
        buf[offset + 35] = 0;
    }
}

export class Roof implements TownObject {
    offsetX = 0;
    offsetY = 0;

    setOffsetX(offsetX: number) {
        this.offsetX = offsetX;
    }
    setOffsetY(offsetY: number) {
        this.offsetY = offsetY;
    }

    constructor(public house: House, public color: Color, public isFlat: boolean, public direction: boolean) {
    }

    getTriangleCount(): number {
        return 2;
    }

    isStatic(): boolean {
        return true;
    }

    writeColors(buf: Uint8ClampedArray, offset: number): void {
        for (let i = 0; i < this.getTriangleCount() * 3; ++i) {
            buf[offset + i * 4] = this.color.r;
            buf[offset + i * 4 + 1] = this.color.g;
            buf[offset + i * 4 + 2] = this.color.b;
            buf[offset + i * 4 + 3] = this.color.a;
        }
    }

    writeTriangles(buf: Float32Array, offset: number): void {
        const leftX = this.house.centerX - this.house.width / 2 + this.offsetX;
        const rightX = this.house.centerX + this.house.width / 2 + this.offsetX;

        const frontY = this.house.centerY + this.house.depth / 2 + this.offsetY;
        const backY = this.house.centerY - this.house.depth / 2 + this.offsetY;

        const ceilZ = this.house.height;
        buf[offset + 0] = leftX;
        buf[offset + 1] = frontY;
        buf[offset + 2] = ceilZ;

        buf[offset + 3] = rightX;
        buf[offset + 4] = frontY;
        buf[offset + 5] = ceilZ;

        buf[offset + 6] = rightX;
        buf[offset + 7] = backY;
        buf[offset + 8] = ceilZ;

        buf[offset + 9] = rightX;
        buf[offset + 10] = backY;
        buf[offset + 11] = ceilZ;

        buf[offset + 12] = leftX;
        buf[offset + 13] = backY;
        buf[offset + 14] = ceilZ;

        buf[offset + 15] = leftX;
        buf[offset + 16] = frontY;
        buf[offset + 17] = ceilZ;
    }
}

export enum TownObjectType {
    HOUSE,
    TREE,
    ROAD
}

export class Color {

    constructor(public r: number, public g: number, public b: number, public a: number) {
    }
}
