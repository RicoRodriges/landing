import { Direction } from "./Direction";
import Wire from "./Wire";

export default class Light extends Wire {

    private readonly lightColor: 0 | 1 | 2 | 3;

    public constructor(el: SVGGElement) {
        super(el, require("./light.svg"));
        this.lightColor = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
    }

    protected wireDirections(): Direction[] {
        return [Direction.North];
    }

    public className() {
        return [...super.className(), 'light' + this.lightColor];
    }

    public isEnabled() {
        return this.enabled;
    }
}