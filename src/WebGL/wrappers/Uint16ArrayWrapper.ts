import ArrayWrapper from "./ArrayWrapper";

export default class Uint16ArrayWrapper extends ArrayWrapper<number, Uint16Array> {

    constructor(capacity: number) {
        super(capacity, Uint16Array);
    }

    protected setValue(view: DataView, byteOffset: number, value: number) {
        view.setUint16(byteOffset, value, true);
    }
}
