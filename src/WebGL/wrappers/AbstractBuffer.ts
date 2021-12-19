
export default abstract class AbstractBuffer {

    protected buf: ArrayBuffer;
    protected view: DataView;
    protected size: number;

    protected constructor(bytes: number) {
        this.buf = new ArrayBuffer(bytes);
        this.view = new DataView(this.buf, 0, bytes);
        this.size = 0;
    }

    public clean() {
        this.size = 0;
    }

    public reserveAndClean(bytes: number) {
        if (bytes > this.buf.byteLength) {
            this.buf = new ArrayBuffer(bytes);
            this.view = new DataView(this.buf, 0, bytes);
        }
        this.clean();
    }

    public get rawBuffer() {
        return this.buf;
    }

    public get bytes() {
        return this.size;
    }

    protected slice<ARR>(construct: TypedArray<ARR>, start?: number, length?: number): ARR {
        start = start || 0;
        length = length || Math.trunc((this.size - start) / construct.BYTES_PER_ELEMENT);
        return new construct(this.buf, start, length);
    }
}

interface TypedArray<ARR> {
    readonly BYTES_PER_ELEMENT: number;

    new(buffer: ArrayBufferLike, byteOffset?: number, length?: number): ARR;
}