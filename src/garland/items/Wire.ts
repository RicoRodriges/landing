import { Direction } from "./Direction";
import Item from "./Item";

export default abstract class Wire extends Item {

    protected abstract wireDirections(): Direction[];
    
    public onCharge(d: Direction) {
        if (this.enabled) return; // loop was handled
        
        const ends = this.wireDirections().map(v => Wire.RotateDirection(this.rotate, v));
        if (ends.indexOf(d) !== -1) {
            this.enabled = true;
            ends.forEach(v => this.sendOnCharge(v));
        }
    }

    private static RotateDirection(r: 0 | 1 | 2 | 3, d: Direction): Direction {
        if (r === 0) return d;

        const v = [Direction.North, Direction.East, Direction.South, Direction.West];
        const i = v.indexOf(d) + r;
        return v[i >= 4 ? (i - 4) : i];
    }
}