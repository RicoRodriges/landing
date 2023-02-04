import generateField from "./Generator";
import Corner from "./items/Corner";
import Cross from "./items/Cross";
import { Direction } from "./items/Direction";
import Generator from "./items/Generator";
import Item from "./items/Item";
import Light from "./items/Light";
import Line from "./items/Line";
import Tee from "./items/Tee";

export default class GarlandController {

    private static readonly ITEM_SIZE = 50;

    private readonly game: [SVGGElement, Item][][];
    private readonly generators: Generator[];
    private readonly redrawHandler: () => void;

    public constructor(private readonly svg: SVGSVGElement, private readonly w: number, private readonly h: number, generatorNum: number, onProgress: (current: number, total: number) => any) {

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${GarlandController.ITEM_SIZE * w} ${GarlandController.ITEM_SIZE * h}`);
        
        const [field, generatorPositions] = generateField(w, h, generatorNum);
        this.generators = [];

        this.game = new Array(w);
        for (let x = 0; x < w; ++x) {
            this.game[x] = new Array(h);
            for (let y = 0; y < h; ++y) {
                const isGenerator = generatorPositions.some(v => v[0] === x && v[1] === y);
                if (isGenerator) {
                    const item = GarlandController.createGameGrid(svg, e => new Generator(e));
                    this.generators.push(item[1]);
                    this.game[x][y] = item;
                } else {
                    this.game[x][y] = GarlandController.createGameGrid(svg, GarlandController.ToConstructor(field[y*w + x]));
                }
            }
        }

        for (let i = 0; i < w; ++i) {
            for (let j = 0; j < h; ++j) {
                const map = new Map<Direction, Item>();
                if (i !== 0) map.set(Direction.West, this.game[i - 1][j][1]);
                if (j !== 0) map.set(Direction.North, this.game[i][j - 1][1]);
                if (i !== w - 1) map.set(Direction.East, this.game[i + 1][j][1]);
                if (j !== h - 1) map.set(Direction.South, this.game[i][j + 1][1]);
                this.game[i][j][1].setNeighbors(map);
            }
        }

        const lights = this.game.flatMap(r => r.map(v => v[1]).filter(v => v instanceof Light) as Light[]);
        this.redrawHandler = () => {
            this.onRedraw();
            
            const enabled = lights.filter(l => l.isEnabled()).length;
            const total = lights.length;
            onProgress(enabled, total);
        };
        svg.addEventListener('click', this.redrawHandler);
        this.redrawHandler();
    }

    public unmount() {
        this.svg.removeEventListener('click', this.redrawHandler);
    }

    private onRedraw() {
        // reset
        for (const v of this.game) {
            for (const [_, item] of v) {
                item.resetCharge();
            }
        }
        
        // reprocess
        this.generators.forEach(g => g.startCharge());
        
        // redraw
        const halfX = 100 / this.w / 2;
        const halfY = 100 / this.h / 2;
        for (let x = 0; x < this.w; ++x) {
            for (let y = 0; y < this.h; ++y) {
                const [svg, item] = this.game[x][y];
                
                const classNames = item.className();
                svg.classList.remove(...svg.classList);
                svg.classList.add(...classNames);

                svg.style.transform = `translate(${halfX + 2*halfX*x}%, ${halfY + 2*halfY*y}%) rotate(${item.getRotateDeg()}deg) translate(-${halfX}%, -${halfY}%)`;
            }
        }
    }

    private static createGameGrid<T extends Item>(svg: SVGSVGElement, construct: (e: SVGGElement) => T): [SVGGElement, T] {

        const itemContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const item = construct(itemContainer);
        
        svg.appendChild(itemContainer);

        return [itemContainer, item];
    }

    private static ToConstructor(v: number): ((e: SVGGElement) => Item) {
        switch(v) {
            case Direction.North:
            case Direction.South:
            case Direction.West:
            case Direction.East:
                return (e) => new Light(e);
            case Direction.North | Direction.East:
            case Direction.East | Direction.South:
            case Direction.South | Direction.West:
            case Direction.West | Direction.North:
                return (e) => new Corner(e);
            case Direction.North | Direction.South:
            case Direction.West | Direction.East:
                return (e) => new Line(e);
            case Direction.North | Direction.East | Direction.South:
            case Direction.East | Direction.South | Direction.West:
            case Direction.South | Direction.West | Direction.North:
            case Direction.West | Direction.North | Direction.East:
                return (e) => new Tee(e);
            default:
                return (e) => new Cross(e);
        }
    }
}