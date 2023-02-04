import { Direction } from "./Direction";
import Wire from "./Wire";

export default class Line extends Wire {

    public constructor(el: SVGGElement) {
        super(el, require("./line.svg"));
    }
    
    protected wireDirections(): Direction[] {
        return [Direction.West, Direction.East];
    }
}