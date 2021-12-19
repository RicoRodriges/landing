import ArrayWrapper from "./ArrayWrapper";

export default class Float32ArrayWrapper extends ArrayWrapper<number, Float32Array> {

    constructor(capacity: number) {
        super(capacity, Float32Array);
    }

    protected setValue(view: DataView, byteOffset: number, value: number) {
        view.setFloat32(byteOffset, value, true);
    }
}
