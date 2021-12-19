export interface TypedArray<ARR> {
    readonly BYTES_PER_ELEMENT: number;

    new(buffer: ArrayBufferLike, byteOffset?: number, length?: number): ARR;
}

export default abstract class ArrayWrapper<T, ARR> {

    protected buf: ArrayBuffer;
    protected view: DataView;
    protected length: number;

    protected toBytes(capacity: number) {
        return capacity * this.constr.BYTES_PER_ELEMENT;
    }

    protected constructor(capacity: number,
                          protected readonly constr: TypedArray<ARR>) {
        const bytes = this.toBytes(capacity);
        this.buf = new ArrayBuffer(bytes);
        this.view = new DataView(this.buf, 0, bytes);
        this.length = 0;
    }

    public clean() {
        this.length = 0;
    }

    public reserveAndClean(capacity: number) {
        const bytes = this.toBytes(capacity);
        if (bytes > this.buf.byteLength) {
            this.buf = new ArrayBuffer(bytes);
            this.view = new DataView(this.buf, 0, bytes);
        }
        this.clean();
    }

    public allocSlice(len: number): ARR {
        const array = new this.constr(this.buf, this.toBytes(this.length), len);
        this.length += len;
        return array;
    }

    public slice(start?: number, length?: number): ARR {
        start = start || 0;
        length = length || (this.length - start);
        return new this.constr(this.buf, this.toBytes(start), length);
    }

    public get size() {
        return this.length;
    }

    public writeV4(r: T, g: T, b: T, a: T) {
        let offset = this.toBytes(this.length);
        this.setValue(this.view, offset, r);
        offset += this.constr.BYTES_PER_ELEMENT;
        this.setValue(this.view, offset, g);
        offset += this.constr.BYTES_PER_ELEMENT;
        this.setValue(this.view, offset, b);
        offset += this.constr.BYTES_PER_ELEMENT;
        this.setValue(this.view, offset, a);

        this.length += 4;
    }

    public writeV3(x: T, y: T, z: T) {
        let offset = this.toBytes(this.length);
        this.setValue(this.view, offset, x);
        offset += this.constr.BYTES_PER_ELEMENT;
        this.setValue(this.view, offset, y);
        offset += this.constr.BYTES_PER_ELEMENT;
        this.setValue(this.view, offset, z);

        this.length += 3;
    }

    protected abstract setValue(view: DataView, byteOffset: number, value: T): void;
}
