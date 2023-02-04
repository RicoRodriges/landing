import { Direction } from "./Direction";
import Item from "./Item";

export default class Generator extends Item {

    public constructor(el: SVGGElement) {
        super(el, require("./generator.svg"));
    }

    public className() {
        // generator is always on
        const v = super.className();
        const off = v.indexOf('off');
        if (off !== -1) v[off] = 'on';
        return v;
    }
    
    public onCharge(d: Direction) {
        // Do nothing
    }

    // called by controller
    public startCharge() {
        let charge: Direction;
        switch(this.rotate) {
            case 0:
                charge = Direction.North;
                break;
            case 1:
                charge = Direction.East;
                break;
            case 2:
                charge = Direction.South;
                break;
            case 3:
                charge = Direction.West;
                break;
            default:
                throw new Error('Unexpected');
        }
        this.sendOnCharge(charge);
    }
}