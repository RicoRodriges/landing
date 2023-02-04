import { Direction } from "./Direction";
import Wire from "./Wire";

export default class Tee extends Wire {

    public constructor(el: SVGGElement) {
        super(el, require("./tee.svg"));
    }
    
    protected wireDirections(): Direction[] {
        return [Direction.West, Direction.South, Direction.East];
    }
}