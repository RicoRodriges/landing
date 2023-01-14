import { Direction } from "./Direction";

/**
 * Generates maze.
 * ↑ y, North
 * → x, East
 * @see https://www.dstromberg.com/2013/07/tutorial-random-maze-generation-algorithm-in-javascript/
 * @returns array of directions. `(v[y*w + x] & Direction.West)` means `(x,y)` cell has `West` path
 */
export default function generateMaze(w: number, h: number): Uint8Array {

    const totalCells = w * h;
    const cells = new Uint8Array(totalCells);
    const visit = new Uint8Array(totalCells);

    const markVisited = (x: number, y: number) => visit[y * w + x] = 1;
    const isVisited = (x: number, y: number) => visit[y * w + x] === 1;
    const addPath = (x: number, y: number, p: Direction) => cells[y * w + x] |= p;
    
    let current: [number, number] = [Math.floor(Math.random() * w), Math.floor(Math.random() * h)];
    const stack = [current];
    markVisited(current[0], current[1]);
    
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
        } else {
            // has no unvisited neighbors, go back
            current = stack.pop()!;
        }
    }
    return cells;
}