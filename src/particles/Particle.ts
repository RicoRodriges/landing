import {Point} from "./graphic-types";

export default class Particle extends Point {
    x: number;
    y: number;

    vx: number;
    vy: number;

    constructor(w: number, h: number) {
        super(0,0);
        this.x = Math.random() * w;
        this.y = Math.random() * h;

        const rad = Math.random() * Math.PI * 2;
        this.vx = Math.cos(rad) * 2;
        this.vy = Math.sin(rad) * 2;
    }

    update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;

        let changeX = true;
        if (this.x < 0)
            this.x = 0;
        else if (this.x > w)
            this.x = w;
        else changeX = false;

        if (changeX)
            this.vx *= -1;

        let changeY = true;
        if (this.y < 0)
            this.y = 0;
        else if (this.y > h)
            this.y = h;
        else changeY = false;

        if (changeY)
            this.vy *= -1;
    }
}
