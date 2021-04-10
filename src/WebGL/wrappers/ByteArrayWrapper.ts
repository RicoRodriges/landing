import ArrayWrapper from "./ArrayWrapper";

export default class ByteArrayWrapper<T> extends ArrayWrapper<T, Uint8ClampedArray> {

    constructor(elSize: number, writer: ((el: T, buf: Uint8ClampedArray)=>void), buf: T[] = []) {
        super(elSize, writer, buf);
    }

    protected createArray(len: number) {
        return new Uint8ClampedArray(len);
    }

    protected createViewFromArray(arr: Uint8ClampedArray, byteOffset: number, len: number) {
        return new Uint8ClampedArray(arr.buffer, byteOffset, len);
    }

    protected getSizeOfArrayElement(): number {
        return 1;
    }
}
