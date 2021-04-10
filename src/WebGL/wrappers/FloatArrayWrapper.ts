import ArrayWrapper from "./ArrayWrapper";

export default class FloatArrayWrapper<T> extends ArrayWrapper<T, Float32Array> {

    constructor(elSize: number, writer: ((el: T, buf: Float32Array)=>void), buf: T[] = []) {
        super(elSize, writer, buf);
    }

    protected createArray(len: number): Float32Array {
        return new Float32Array(len);
    }

    protected createViewFromArray(arr: Float32Array, byteOffset: number, len: number): Float32Array {
        return new Float32Array(arr.buffer, byteOffset, len);
    }

    protected getSizeOfArrayElement(): number {
        return 4;
    }
}
