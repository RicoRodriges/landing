import { Direction } from "./Direction";
import Wire from "./Wire";

export default class Cross extends Wire {

    public constructor(el: SVGGElement) {
        super(el, require("./cross.svg"));
    }
    
    protected wireDirections(): Direction[] {
        return [Direction.North, Direction.West, Direction.South, Direction.East];
    }
}