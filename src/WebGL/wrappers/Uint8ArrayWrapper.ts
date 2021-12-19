import ArrayWrapper from "./ArrayWrapper";

export default class Uint8ClampedArrayWrapper extends ArrayWrapper<number, Uint8ClampedArray> {

    constructor(capacity: number) {
        super(capacity, Uint8ClampedArray);
    }

    protected setValue(view: DataView, byteOffset: number, value: number) {
        view.setUint8(byteOffset, value);
    }
}