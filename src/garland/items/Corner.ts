import { Direction } from "./Direction";
import Wire from "./Wire";

export default class Corner extends Wire {

    public constructor(el: SVGGElement) {
        super(el, require("./corner.svg"));
    }
    
    protected wireDirections(): Direction[] {
        return [Direction.West, Direction.South];
    }
}