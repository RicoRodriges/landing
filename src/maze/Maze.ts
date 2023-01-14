import { Direction } from "./Direction";
import generateMaze from "./Generator";

export default class Maze {
    private readonly cells: Uint8Array;
    private readonly w: number;
    private readonly h: number;
    
    public constructor(w: number, h: number) {
        this.w = w;
        this.h = h;
        this.cells = generateMaze(w, h);
    }

    public hasWall(x: number, y: number, d: Direction) {
        return (this.cells[y * this.w + x] & d) === 0;
    }

    public getWidth() {
        return this.w;
    }

    public getHeight() {
        return this.h;
    }
}