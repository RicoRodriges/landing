import {
    Cuboid,
    Plane45deg,
    PlaneRotate,
    PrimitiveInfo, Pyramid, rotateZ180,
    translate,
    Triangle,
    XYPlane, XZPlane,
    YZPlane
} from "../WebGL/Primitives";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import IndexBuffer from "../WebGL/wrappers/IndexBuffer";

export abstract class TownObject {
    abstract getTriangleCount(): number;

    abstract writeObject(vertexes: DataBuffer, indexes: IndexBuffer): void;

    frameUpdate() {
    }
}

export class DebugFloor extends TownObject {
    private color = Color.RandomColor();

    public constructor(private width: number) {
        super();
    }

    getTriangleCount() {
        return 2;
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        const plane = XYPlane(this.width, this.width);
        writeObject(vertexes, indexes, plane, this.color);
    }
}

export class House extends TownObject {
    public roof?: Roof;
    public windows: Windows;
    public antenna?: Antenna;

    frameUpdate() {
        super.frameUpdate();
        this.roof?.frameUpdate();
        this.windows.frameUpdate();
        this.antenna?.frameUpdate();
    }

    public width: number;
    public depth: number;
    public x: number;
    public y: number;

    constructor(gridSize: number, public height: number, public color: Color) {
        super();
        this.width = gridSize / (Math.random() * 3 + 1);
        this.depth = gridSize / (Math.random() * 3 + 1);
        this.x = (gridSize - this.width) / (Math.random() * 5 + 1);
        this.y = (gridSize - this.depth) / (Math.random() * 5 + 1);
        this.roof = Math.random() > 0.33 ? new Roof(color, this.x, this.y, height, this.width, this.depth) : undefined;
        this.windows = new Windows(color, this.x, this.y, this.width, this.height, this.depth);
        this.antenna = Math.random() <= 0.3 ? new Antenna(this.x, this.y, this.height, this.width, this.depth) : undefined;
    }

    getTriangleCount(): number {
        return 12 +
            (this.roof?.getTriangleCount() || 0) +
            this.windows.getTriangleCount() +
            (this.antenna?.getTriangleCount() || 0);
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        const cube = Cuboid(this.width, this.depth, this.height);
        translate(cube, this.x, this.y, 0);
        writeObject(vertexes, indexes, cube, this.color);

        this.roof?.writeObject(vertexes, indexes);
        this.windows.writeObject(vertexes, indexes);
        this.antenna?.writeObject(vertexes, indexes);
    }
}

enum RoofType {
    X, Y
}

export class Roof extends TownObject {

    static readonly ROOF_HEIGHT = 20;
    public type: RoofType;
    public roofColor: Color;

    constructor(public houseColor: Color,
                public x: number, public y: number, public z: number,
                public w: number, public d: number) {
        super();

        this.type = Math.random() <= 0.5 ? RoofType.X : RoofType.Y;
        this.roofColor = new Color(70, 70, 70, houseColor.a);
    }

    getTriangleCount() {
        return 6;
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        if (this.type === RoofType.X) {
            const nearPlane = Plane45deg(this.w, this.d / 2, Roof.ROOF_HEIGHT, true, PlaneRotate.X);
            translate(nearPlane, this.x, this.y, this.z);
            writeObject(vertexes, indexes, nearPlane, this.roofColor);

            const farPlane = Plane45deg(this.w, this.d / 2, Roof.ROOF_HEIGHT, false, PlaneRotate.X);
            translate(farPlane, this.x, this.y + this.d / 2, this.z);
            writeObject(vertexes, indexes, farPlane, this.roofColor);

            const nearTriangle = Triangle(0, this.d / 2, Roof.ROOF_HEIGHT, 0, this.d, 0, -1, 0, 0);
            translate(nearTriangle, this.x, this.y, this.z);
            writeObject(vertexes, indexes, nearTriangle, this.houseColor);

            const farTriangle = Triangle(0, this.d, 0, 0, this.d / 2, Roof.ROOF_HEIGHT, 1, 0, 0);
            translate(farTriangle, this.x + this.w, this.y, this.z);
            writeObject(vertexes, indexes, farTriangle, this.houseColor);
        } else if (this.type === RoofType.Y) {
            const nearPlane = Plane45deg(this.w / 2, this.d, Roof.ROOF_HEIGHT, true, PlaneRotate.Y);
            translate(nearPlane, this.x, this.y, this.z);
            writeObject(vertexes, indexes, nearPlane, this.roofColor);

            const farPlane = Plane45deg(this.w / 2, this.d, Roof.ROOF_HEIGHT, false, PlaneRotate.Y);
            translate(farPlane, this.x + this.w / 2, this.y, this.z);
            writeObject(vertexes, indexes, farPlane, this.roofColor);

            const nearTriangle = Triangle(this.w, 0, 0, this.w / 2, 0, Roof.ROOF_HEIGHT, 0, -1, 0);
            translate(nearTriangle, this.x, this.y, this.z);
            writeObject(vertexes, indexes, nearTriangle, this.houseColor);

            const farTriangle = Triangle(this.w / 2, 0, Roof.ROOF_HEIGHT, this.w, 0, 0, 0, 1, 0);
            translate(farTriangle, this.x, this.y + this.d, this.z);
            writeObject(vertexes, indexes, farTriangle, this.houseColor);
        }
    }
}

type WindowsAnim = {
    delayFrames: number, currentFrame: number, duration: number
}

export class Windows extends TownObject {

    static readonly windowWidth = 20;
    static readonly windowHeight = 20;

    static readonly offset = 5;

    static readonly activeWindowsOnOneWall = 4;

    windowsZ: number;
    windowsX: number;
    windowsY: number;

    activeWindowsX = new Map<number, WindowsAnim>();
    activeWindowsY = new Map<number, WindowsAnim>();

    constructor(public color: Color,
                public x: number, public y: number,
                public width: number, public height: number, public depth: number) {
        super();
        this.color = new Color(this.color.r - 10, this.color.g - 10, this.color.b - 10, this.color.a);

        this.windowsZ = Math.trunc(height / (Windows.windowHeight + 2 * Windows.offset));
        this.windowsY = Math.trunc(depth / (Windows.windowWidth + 2 * Windows.offset));
        this.windowsX = Math.trunc(width / (Windows.windowWidth + 2 * Windows.offset));

        if (this.windowsZ > 0) {
            if (this.windowsY > 0) {
                for (let i = 0; i < Windows.activeWindowsOnOneWall; ++i) {
                    const y = Math.trunc(Math.random() * this.windowsY);
                    const z = Math.trunc(Math.random() * this.windowsZ);
                    this.activeWindowsY.set(z * 1000 + y, {
                        delayFrames: Math.random() * 60 * 5 + 60,
                        currentFrame: 0,
                        duration: Math.random() * 60 * 2 + 60,
                    });
                }
            }
            if (this.windowsX > 0) {
                for (let i = 0; i < Windows.activeWindowsOnOneWall; ++i) {
                    const x = Math.trunc(Math.random() * this.windowsX);
                    const z = Math.trunc(Math.random() * this.windowsZ);
                    this.activeWindowsX.set(z * 1000 + x, {
                        delayFrames: Math.random() * 60 * 5 + 60,
                        currentFrame: 0,
                        duration: Math.random() * 60 * 2 + 60,
                    });
                }
            }
        }
    }

    getTriangleCount(): number {
        return (this.windowsY + this.windowsX) * 2 * this.windowsZ * 2;
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        const zWindowSize = Windows.windowHeight + 2 * Windows.offset;
        const zOffset = (this.height - this.windowsZ * zWindowSize) / 2;

        const xyWindowSize = Windows.windowWidth + 2 * Windows.offset;
        const yOffset = (this.depth - this.windowsY * xyWindowSize) / 2;
        const xOffset = (this.width - this.windowsX * xyWindowSize) / 2;

        // YZ wall
        {
            const x = this.x;
            for (let zi = 0; zi < this.windowsZ; ++zi) {
                const z = zi * zWindowSize + Windows.offset + zOffset;
                for (let yi = 0; yi < this.windowsY; ++yi) {
                    const y = yi * xyWindowSize + Windows.offset + this.y + yOffset;

                    const anim = this.animInfo(undefined, yi, zi);
                    const color = anim ? Windows.calcColor(this.color, anim) : this.color;

                    const plane = YZPlane(Windows.windowWidth, Windows.windowHeight);
                    translate(plane, x - 1, y, z);
                    writeObject(vertexes, indexes, plane, color);

                    const planeBack = YZPlane(Windows.windowWidth, Windows.windowHeight);
                    rotateZ180(planeBack);
                    translate(planeBack, x + this.width + 1, y, z);
                    writeObject(vertexes, indexes, planeBack, color);
                }
            }
        }

        // XZ wall
        {
            const y = this.y;
            for (let zi = 0; zi < this.windowsZ; ++zi) {
                const z = zi * zWindowSize + Windows.offset + zOffset;
                for (let xi = 0; xi < this.windowsX; ++xi) {
                    const x = xi * xyWindowSize + Windows.offset + this.x + xOffset;

                    const anim = this.animInfo(xi, undefined, zi);
                    const color = anim ? Windows.calcColor(this.color, anim) : this.color;

                    const plane = XZPlane(Windows.windowWidth, Windows.windowHeight);
                    translate(plane, x, y - 1, z);
                    writeObject(vertexes, indexes, plane, color);

                    const planeBack = XZPlane(Windows.windowWidth, Windows.windowHeight);
                    rotateZ180(planeBack);
                    translate(planeBack, x, y + this.depth + 1, z);
                    writeObject(vertexes, indexes, planeBack, color);
                }
            }
        }
    }

    private animInfo(x: number | undefined, y: number | undefined, z: number) {
        if (x !== undefined) {
            return this.activeWindowsX.get(z * 1000 + x);
        } else if (y !== undefined) {
            return this.activeWindowsY.get(z * 1000 + y);
        }
    }

    frameUpdate() {
        super.frameUpdate();
        this.activeWindowsX.forEach((anim) => Windows.updateAnim(anim));
        this.activeWindowsY.forEach((anim) => Windows.updateAnim(anim));
    }

    private static updateAnim(anim: WindowsAnim) {
        anim.currentFrame++;
        // delay + light anim + delay + dark anim
        if (anim.currentFrame >= anim.delayFrames + anim.duration + anim.delayFrames + anim.duration) {
            anim.currentFrame = 0;
        }
    }

    private static calcColor(color: Color, { delayFrames, currentFrame, duration }: WindowsAnim) {
        if (currentFrame <= delayFrames) {
            return color;
        }

        currentFrame -= delayFrames;
        if (currentFrame <= duration) {
            const add = 170 / duration * currentFrame;
            return new Color(color.r + add, color.g + add, color.b + add, color.a);
        }

        currentFrame -= duration;
        if (currentFrame <= delayFrames) {
            const add = 170;
            return new Color(color.r + add, color.g + add, color.b + add, color.a);
        }

        currentFrame -= delayFrames;
        if (currentFrame <= duration) {
            const add = 170 - 170 / duration * currentFrame;
            return new Color(color.r + add, color.g + add, color.b + add, color.a);
        }
        return color;
    }
}

export class Antenna extends TownObject {

    static readonly WIDTH = 15;
    static readonly HEIGHT = 35;
    static readonly LINE_WIDTH = 2;
    static readonly OFFSET = 6;

    x: number;
    y: number;
    lines: number;
    direction: boolean;
    color = new Color(40, 40, 40, 255);

    constructor(x: number, y: number, public z: number,
                w: number, d: number) {
        super();

        const r = Math.random();
        if (r <= 0.25) {
            this.x = x + Antenna.OFFSET;
            this.y = y + Antenna.OFFSET;
        } else if (r <= 0.5) {
            this.x = x + w - Antenna.OFFSET;
            this.y = y + Antenna.OFFSET;
        } else if (r <= 0.75) {
            this.x = x + Antenna.OFFSET;
            this.y = y + d - Antenna.OFFSET;
        } else {
            this.x = x + w - Antenna.OFFSET;
            this.y = y + d - Antenna.OFFSET;
        }
        this.direction = Math.random() < 0.5;
        this.lines = Math.round(Math.random() * 3 + 1);
    }

    getTriangleCount(): number {
        return (this.lines + 1) * 4;
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        const x = this.x;
        const y = this.y;

        const planeGenerator = this.direction ? XZPlane : YZPlane;
        const xOffset = this.direction ? Antenna.WIDTH / 2 : 0;
        const yOffset = this.direction ? 0 : Antenna.WIDTH / 2;

        const mainPlane = planeGenerator(Antenna.LINE_WIDTH, Antenna.HEIGHT);
        translate(mainPlane, x, y, this.z);
        writeObject(vertexes, indexes, mainPlane, this.color);

        const mainBackPlane = planeGenerator(Antenna.LINE_WIDTH, Antenna.HEIGHT);
        rotateZ180(mainBackPlane);
        translate(mainBackPlane, x, y, this.z);
        writeObject(vertexes, indexes, mainBackPlane, this.color);

        for (let i = 0; i < this.lines; ++i) {
            const z = this.z + Antenna.HEIGHT - (Antenna.HEIGHT / 2 / this.lines * (i + 1));

            const linePlane = planeGenerator(Antenna.WIDTH, Antenna.LINE_WIDTH);
            translate(linePlane, x - xOffset, y - yOffset, z);
            writeObject(vertexes, indexes, linePlane, this.color);

            const lineBackPlane = planeGenerator(Antenna.WIDTH, Antenna.LINE_WIDTH);
            rotateZ180(lineBackPlane);
            translate(lineBackPlane, x - xOffset, y - yOffset, z);
            writeObject(vertexes, indexes, lineBackPlane, this.color);
        }
    }
}

export class Tree extends TownObject {

    static readonly ROOT_WIDTH = 5;
    static readonly WIDTH = 60;
    static readonly HEIGHT = 200;
    static readonly MAX_LEAF = 3;

    x: number;
    y: number;
    height: number;
    width: number;
    leaf: number;

    readonly ROOT_COLOR = new Color(112, 94, 88, 255);
    readonly LEAF_COLOR = new Color(64, 93, 53, 255);

    constructor(gridSize: number) {
        super();
        this.width = Tree.WIDTH + Math.trunc(Math.random() * 40 - 20);
        this.height = Tree.HEIGHT + Math.trunc(Math.random() * 80 - 40);
        this.x = (gridSize - this.width) / (Math.random() * 10 + 1);
        this.y = (gridSize - this.width) / (Math.random() * 10 + 1);
        this.leaf = Math.random() < 0.5 ? 1 : Tree.MAX_LEAF;
    }

    getTriangleCount(): number {
        // root + leaf
        return 12 + 6 * this.leaf;
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        const rootHeight = h / (Tree.MAX_LEAF + 1);

        const root = Cuboid(Tree.ROOT_WIDTH, Tree.ROOT_WIDTH, rootHeight);
        translate(root, x + w / 2 - Tree.ROOT_WIDTH / 2, y + w / 2 - Tree.ROOT_WIDTH / 2, 0);
        writeObject(vertexes, indexes, root, this.ROOT_COLOR);

        const sector = (h - rootHeight) / this.leaf;
        for (let i = 1; i <= this.leaf; ++i) {
            const width = Math.min(w / i * 1.7, w);
            const height = h - rootHeight - sector * (i - 1);
            const leaf = Pyramid(width, width, height);
            translate(leaf, x + (w - width) / 2, y + (w - width) / 2, h - height);
            writeObject(vertexes, indexes, leaf, this.LEAF_COLOR);
        }
    }
}

export enum RoadDirection {
    X, Y, LINK
}

export class Road extends TownObject {

    static readonly OFFSET = 20;
    static readonly LINES = 4;

    readonly BORDER_COLOR = new Color(175, 157, 151, 255);
    readonly ROAD_COLOR = new Color(163, 145, 139, 255);
    readonly LINE_COLOR = new Color(255, 255, 255, 255);

    constructor(public gridSize: number, public direction: RoadDirection) {
        super();
    }

    getTriangleCount(): number {
        if (this.direction != RoadDirection.LINK) {
            // road + 2 borders + lines
            return 2 + 4 + Road.LINES;
        } else {
            // road + 4 borders
            return 2 + 4;
        }
    }

    writeObject(vertexes: DataBuffer, indexes: IndexBuffer) {
        if (this.direction === RoadDirection.X) {
            const beforeBorder = Road.OFFSET;
            const borderWidth = (this.gridSize - 2 * beforeBorder) / 6;

            const road = XYPlane(this.gridSize, this.gridSize - 2*beforeBorder - 2*borderWidth);
            translate(road, 0, beforeBorder + borderWidth, 0);
            writeObject(vertexes, indexes, road, this.ROAD_COLOR);

            const border = XYPlane(this.gridSize, borderWidth);
            translate(border, 0, beforeBorder, 0);
            writeObject(vertexes, indexes, border, this.BORDER_COLOR);

            translate(border, 0, -beforeBorder + this.gridSize - beforeBorder - borderWidth, 0);
            writeObject(vertexes, indexes, border, this.BORDER_COLOR);

            const lineWidth = this.gridSize / (Road.LINES * 2);
            const line = Triangle(lineWidth, 2, 0, 0, 4, 0, 0, 0, 1);
            translate(line, lineWidth / 2, this.gridSize / 2, 1);

            for (let i = 0; i < Road.LINES; ++i) {
                writeObject(vertexes, indexes, line, this.LINE_COLOR);
                translate(line, lineWidth * 2, 0, 0);
            }
        } else if (this.direction === RoadDirection.Y) {
            const beforeBorder = Road.OFFSET;
            const borderWidth = (this.gridSize - 2 * beforeBorder) / 6;

            const road = XYPlane(this.gridSize - 2*beforeBorder - 2*borderWidth, this.gridSize);
            translate(road, beforeBorder + borderWidth, 0, 0);
            writeObject(vertexes, indexes, road, this.ROAD_COLOR);

            const border = XYPlane(borderWidth, this.gridSize);
            translate(border, beforeBorder, 0, 0);
            writeObject(vertexes, indexes, border, this.BORDER_COLOR);

            translate(border, -beforeBorder + this.gridSize - beforeBorder - borderWidth, 0, 0);
            writeObject(vertexes, indexes, border, this.BORDER_COLOR);

            const lineWidth = this.gridSize / (Road.LINES * 2);
            const line = Triangle(4, 0, 0, 2, lineWidth, 0, 0, 0, 1);
            translate(line, this.gridSize / 2, lineWidth / 2, 1);

            for (let i = 0; i < Road.LINES; ++i) {
                writeObject(vertexes, indexes, line, this.LINE_COLOR);
                translate(line, 0, lineWidth * 2, 0);
            }
        } else if (this.direction === RoadDirection.LINK) {
            const road = XYPlane(this.gridSize, this.gridSize);
            writeObject(vertexes, indexes, road, this.ROAD_COLOR);

            const beforeBorder = Road.OFFSET;
            const borderWidth = (this.gridSize - 2 * beforeBorder) / 6 + beforeBorder;

            const border1 = Triangle(borderWidth, 0, 0, 0, borderWidth, 0, 0, 0, 1);
            translate(border1, 0, 0, 1);
            writeObject(vertexes, indexes, border1, this.BORDER_COLOR);

            const border2 = Triangle(borderWidth, 0, 0, borderWidth, borderWidth, 0, 0, 0, 1);
            translate(border2, this.gridSize - borderWidth, 0, 1);
            writeObject(vertexes, indexes, border2, this.BORDER_COLOR);

            const border3 = Triangle(borderWidth, borderWidth, 0, 0, borderWidth, 0, 0, 0, 1);
            translate(border3, 0, this.gridSize - borderWidth, 1);
            writeObject(vertexes, indexes, border3, this.BORDER_COLOR);

            const border4 = Triangle(-borderWidth, 0, 0, 0, -borderWidth, 0, 0, 0, 1);
            translate(border4, this.gridSize, this.gridSize, 1);
            writeObject(vertexes, indexes, border4, this.BORDER_COLOR);
        }
    }
}

export class Color {

    constructor(public r: number, public g: number, public b: number, public a: number) {
        this.r = r < 0 ? 0 : (r > 255 ? 255 : r);
        this.g = g < 0 ? 0 : (g > 255 ? 255 : g);
        this.b = b < 0 ? 0 : (b > 255 ? 255 : b);
    }

    public static RandomColor() {
        return new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255, 255);
    }
}

function writeObject(vertexes: DataBuffer, indexes: IndexBuffer,
                     obj: PrimitiveInfo, color: Color) {
    const nextIndex = indexes.nextIndex;
    for (let i = 0; i < obj.indexes.length; i += 3) {
        indexes.write3Uint16(
            obj.indexes[i + 0] + nextIndex,
            obj.indexes[i + 1] + nextIndex,
            obj.indexes[i + 2] + nextIndex,
        );
    }

    for (let i = 0; i < obj.positions.length; i += 3) {
        vertexes.write3Float32(
            obj.positions[i + 0],
            obj.positions[i + 1],
            obj.positions[i + 2],
        );

        const n = obj.normals.length === 3 ? 0 : i;
        vertexes.write3Float32(
            obj.normals[n + 0],
            obj.normals[n + 1],
            obj.normals[n + 2],
        );

        vertexes.write4Uint8(
            color.r,
            color.g,
            color.b,
            color.a,
        );
    }
}

export const PALLETS = [
    new Color(0xEE, 0xEE, 0xEE, 0xFF),
    new Color(0x55, 0x55, 0x55, 0xFF),
    new Color(0x87, 0x88, 0x84, 0xFF),
    new Color(0xEC, 0xEC, 0xD7, 0xFF),
    new Color(0xD1, 0xDD, 0xE2, 0xFF),
    new Color(0x91, 0x95, 0x98, 0xFF),
    new Color(0x43, 0x97, 0x4A, 0xFF),
    new Color(0xEB, 0xC6, 0x01, 0xFF),
    new Color(0xC7, 0x5D, 0x6F, 0xFF),
    new Color(0xE7, 0x97, 0x52, 0xFF),
    new Color(0x4A, 0x71, 0xA7, 0xFF),
    new Color(0xD9, 0xAA, 0x8E, 0xFF),
    new Color(0x78, 0x95, 0x6D, 0xFF),
    new Color(0xA5, 0x69, 0x68, 0xFF),
    new Color(0xE4, 0xCB, 0xA9, 0xFF),
    new Color(0xEB, 0xC1, 0x94, 0xFF),
    new Color(0xB7, 0x41, 0x4C, 0xFF),
    new Color(0xE9, 0x54, 0x44, 0xFF),
]

// minHeight is corners. maxHeigth is in center
export function calcHeight(gridX: number, gridY: number, gridWidth: number, gridHeight: number, factor: number,
                           maxHeigth: number, minHeight: number) {
    const v = Math.pow(Math.sin(Math.PI * ((gridX + .5) / gridWidth)) * Math.sin(Math.PI * ((gridY + .5) / gridHeight)), factor);
    return Math.max(Math.min(maxHeigth, maxHeigth * v), minHeight);
}