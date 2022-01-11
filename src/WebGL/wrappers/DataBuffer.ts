import AbstractBuffer from "./AbstractBuffer";

export default class DataBuffer extends AbstractBuffer {

    public constructor(bytes: number) {
        super(bytes);
    }

    public sliceFloat32(start?: number, length?: number): Float32Array {
        return this.slice(Float32Array, start, length);
    }

    public sliceUint16(start?: number, length?: number): Uint16Array {
        return this.slice(Uint16Array, start, length);
    }

    public write4Uint8(r: number, g: number, b: number, a: number) {
        this.view.setUint8(this.size, r);
        this.size += 1;
        this.view.setUint8(this.size, g);
        this.size += 1;
        this.view.setUint8(this.size, b);
        this.size += 1;
        this.view.setUint8(this.size, a);
        this.size += 1;
    }

    public write3Float32(x: number, y: number, z: number) {
        this.view.setFloat32(this.size, x, true);
        this.size += 4;
        this.view.setFloat32(this.size, y, true);
        this.size += 4;
        this.view.setFloat32(this.size, z, true);
        this.size += 4;
    }

    public write2Uint16(x: number, y: number) {
        this.view.setUint16(this.size, x, true);
        this.size += 2;
        this.view.setUint16(this.size, y, true);
        this.size += 2;
    }
}
