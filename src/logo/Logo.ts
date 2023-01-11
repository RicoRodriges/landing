export default class Logo {

    private static readonly SPEED = 2;

    private readonly w: number;
    private readonly h: number;

    private colorIndex = 0;
    private x = 0;
    private right = true;
    private y = 0;
    private down = true;

    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;
    }

    public update(canvasW: number, canvasH: number) {
        this.x += Logo.SPEED * (this.right ? 1 : -1);
        this.y += Logo.SPEED * (this.down ? 1 : -1);

        if (this.x < 0) {
            this.x = 0;
            this.right = true;
            this.colorIndex++;
        } else if (this.x + this.w > canvasW) {
            this.x = canvasW - this.w;
            this.right = false;
            this.colorIndex++;
        }

        if (this.y < 0) {
            this.y = 0;
            this.down = true;
            this.colorIndex++;
        } else if (this.y + this.h > canvasH) {
            this.y = canvasH - this.h;
            this.down = false;
            this.colorIndex++;
        }
    }

    public getRect(): [number, number, number, number] {
        return [this.x, this.y, this.x + this.w, this.y + this.h];
    }

    public getColorIndex() {
        return this.colorIndex;
    }
}
