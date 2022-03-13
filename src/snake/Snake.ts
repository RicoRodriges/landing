export default class Snake implements Iterable<[number, number]> {

    private readonly arr: [number, number][];

    constructor(x: number, y: number) {
        this.arr = [[x, y]];
    }

    public* [Symbol.iterator]() {
        for (const x of this.arr) {
            yield x;
        }
    }

    public isSnake(x: number, y: number, ignoreTail: boolean) {
        return this.arr.some((s, i) => !(ignoreTail && i === 0) && s[0] === x && s[1] === y);
    }

    public add(x: number, y: number) {
        this.arr.push([x, y]);
    }

    public move(x: number, y: number) {
        this.arr.shift();
        this.add(x, y);
    }

    public get length() {
        return this.arr.length;
    }

    public get head() {
        return this.arr[this.arr.length - 1];
    }
}