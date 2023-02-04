import { Direction } from "./items/Direction";

/**
 * Generates game field.
 * ↑ y, North
 * → x, East
 * @see https://www.dstromberg.com/2013/07/tutorial-random-maze-generation-algorithm-in-javascript/
 * @returns 1. array of directions. `(v[y*w + x] & Direction.West)` means `(x,y)` cell has `West` path
 * 2. Point of path starts
 */
export default function generateField(w: number, h: number, pathNum: number): [Uint8Array, Point[]] {

    const totalCells = w * h;
    const cells = new Uint8Array(totalCells);
    const visit = new Uint8Array(totalCells);

    const markVisited = (x: number, y: number) => visit[y * w + x] = 1;
    const isVisited = (x: number, y: number) => visit[y * w + x] === 1;
    const addPath = (x: number, y: number, p: Direction) => cells[y * w + x] |= p;

    const starts: Point[] = new Array(pathNum);
    const generators: ReturnType<typeof pathGenerator>[] = new Array(pathNum);
    for (let i = 0; i < pathNum; ++i) {
        generators[i] = pathGenerator(w, h, markVisited, isVisited, addPath);
        starts[i] = generators[i].next().value!;
    }
    
    // generates `pathNum` pathes step by step in parallel
    while(true) {
        const allAreDone = generators.reduce((allDone, gen) => !!gen.next().done && allDone, true);
        if (allAreDone) break;
    }
    
    return [cells, starts];
}

type Point = [number, number];

/**
 * Each `yield` generates single step and always returns start point
 */
function* pathGenerator(w: number, h: number,
    markVisited: (x: number, y: number) => void,
    isVisited: (x: number, y: number) => boolean,
    addPath: (x: number, y: number, p: Direction) => void,
) {
    const randomStart = getUnvisitedAbout(w, h, Math.floor(Math.random() * w), Math.floor(Math.random() * h), isVisited);
    
    let current = randomStart;
    const stack = [current];
    markVisited(current[0], current[1]);
    yield randomStart;
    
    while (stack.length > 0) {
        const neighbors = ([
            [current[0] - 1, current[1], Direction.West, Direction.East],
            [current[0], current[1] + 1, Direction.North, Direction.South],
            [current[0] + 1, current[1], Direction.East, Direction.West],
            [current[0], current[1] - 1, Direction.South, Direction.North],
        ] as Array<[number, number, Direction, Direction]>).filter(v => v[0] >= 0 && v[0] < w && v[1] >= 0 && v[1] < h && !isVisited(v[0], v[1]));
        
        if (neighbors.length > 0) {
            // go to random unvisited neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            addPath(current[0], current[1], next[2]);
            addPath(next[0], next[1], next[3]);
            
            markVisited(next[0], next[1]);
            current = [next[0], next[1]];
            stack.push(current);
            yield randomStart;
        } else {
            // has no unvisited neighbors, go back
            current = stack.pop()!;
        }
    }
}

function getUnvisitedAbout(w: number, h: number, cx: number, cy: number, isVisited: (x: number, y: number) => boolean): Point {
    if (!isVisited(cx, cy)) {
        return [cx, cy];
    }
    for (let x = cx; x < w; ++x) {
        if (!isVisited(x, cy)) return [x, cy];
    }
    for (let y = cy; y < h; ++y) {
        for (let x = cx + 1; x < w; ++x) {
            if (!isVisited(x, y)) return [x, y];
        }
    }
    for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
            if (!isVisited(x, y)) return [x, y];
        }
    }
    throw new Error('There are no unvisited cells');
}