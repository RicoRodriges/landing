import { Direction } from "./Direction";
import "./items.css";

export default abstract class Item {

    private neighbors?: Map<Direction, Item>;
    protected rotate: 0 | 1 | 2 | 3;
    protected enabled: boolean;

    protected constructor(el: SVGGElement, svg: string) {
        const tagStart = "<svg viewBox=\"0 0 50 50\">";
        const tagEnd = "</svg>";
        if (!svg.startsWith(tagStart) || !svg.endsWith(tagEnd)) {
            throw new Error("Invalid svg format!");
        }

        this.rotate = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
        this.enabled = false;
        
        el.innerHTML = svg.replace(tagStart, "").replace(tagEnd, "");
        el.addEventListener('click', () => {
            this.rotate = this.rotate === 3 ? 0 : (this.rotate + 1) as 1 | 2 | 3;
        });
    }

    public className(): string[] {
        return [`r${this.rotate}`, this.enabled ? 'on' : 'off'];
    }

    public getRotateDeg() {
        return this.rotate * 90;
    }

    protected sendOnCharge(d: Direction) {
        const receiver = this.neighbors?.get(d);
        if (receiver !== undefined) {
            let invert: Direction;
            switch (d) {
                case Direction.North:
                    invert = Direction.South;
                    break;
                case Direction.South:
                    invert = Direction.North;
                    break;
                case Direction.West:
                    invert = Direction.East;
                    break;
                case Direction.East:
                    invert = Direction.West;
                    break;
                default:
                    throw new Error("Unexpected direction");
            }
            receiver.onCharge(invert);
        }
    }

    public setNeighbors(neighbors: Map<Direction, Item>) {
        this.neighbors = neighbors;
    }
    
    public abstract onCharge(d: Direction): void;
    
    public resetCharge() {
        this.enabled = false;
    }
}