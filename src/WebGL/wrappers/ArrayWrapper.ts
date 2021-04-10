export default abstract class ArrayWrapper<T, ARR> {

    constructor(protected elSize: number, protected writer: ((el: T, buf: ARR)=>void),
                public buf: T[]) {
    }

    clear() {
        this.buf = [];
    }

    getLength() {
        return this.buf.length;
    }

    add(el: T) {
        this.buf.push(el);
    }

    protected abstract getSizeOfArrayElement() : number;
    protected abstract createArray(len: number) : ARR;
    // Create view. Does not allocate new memory buffer
    protected abstract createViewFromArray(arr: ARR, byteOffset: number, len: number) : ARR;

    toBuffer() : ARR {
        const len = this.buf.length;
        const bufLen = len * this.elSize;

        const res = this.createArray(bufLen);
        const sizeOf = this.getSizeOfArrayElement();
        for (let i = 0; i < len; ++i) {
            const currentEl = this.buf[i];
            const view = this.createViewFromArray(res, (i * sizeOf) * this.elSize, this.elSize);
            this.writer(currentEl, view);
        }
        return res;
    };
}
