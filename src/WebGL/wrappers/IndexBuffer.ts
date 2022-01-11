import AbstractBuffer from "./AbstractBuffer";

export default class IndexBuffer extends AbstractBuffer {

    protected lastIndex: number;

    public constructor(bytes: number) {
        super(bytes);
        this.lastIndex = -1;
    }

    public clean() {
        super.clean();
        this.lastIndex = -1;
    }

    public sliceUint8(start?: number, length?: number): Uint8Array {
        return this.slice(Uint8Array, start, length);
    }

    public sliceUint16(start?: number, length?: number): Uint16Array {
        return this.slice(Uint16Array, start, length);
    }

    public write3Uint8(i1: number, i2: number, i3: number) {
        this.view.setUint8(this.size, i1);
        this.size += 1;
        this.view.setUint8(this.size, i2);
        this.size += 1;
        this.view.setUint8(this.size, i3);
        this.size += 1;

        this.lastIndex = Math.max(this.lastIndex, i1, i2, i3);
    }

    public write3Uint16(i1: number, i2: number, i3: number) {
        this.view.setUint16(this.size, i1, true);
        this.size += 2;
        this.view.setUint16(this.size, i2, true);
        this.size += 2;
        this.view.setUint16(this.size, i3, true);
        this.size += 2;

        this.lastIndex = Math.max(this.lastIndex, i1, i2, i3);
    }

    public write2Uint16(i1: number, i2: number) {
        this.view.setUint16(this.size, i1, true);
        this.size += 2;
        this.view.setUint16(this.size, i2, true);
        this.size += 2;

        this.lastIndex = Math.max(this.lastIndex, i1, i2);
    }

    public write1Uint16(i1: number) {
        this.view.setUint16(this.size, i1, true);
        this.size += 2;

        this.lastIndex = Math.max(this.lastIndex, i1);
    }

    public get nextIndex() {
        return this.lastIndex + 1;
    }
}
