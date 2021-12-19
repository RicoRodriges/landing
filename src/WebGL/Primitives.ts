export interface PrimitiveInfo {
    positions: number[],
    normals: number[],
    indexes: number[],
}

export function translate(obj: PrimitiveInfo, dx: number, dy: number, dz: number) {
    for (let i = 0; i < obj.positions.length; i += 3) {
        obj.positions[i + 0] += dx;
        obj.positions[i + 1] += dy;
        obj.positions[i + 2] += dz;
    }
}

export function rotateZ180(obj: PrimitiveInfo) {
    let maxX = -100000;
    let maxY = -100000;
    for (let i = 0; i < obj.positions.length; i += 3) {
        const x = obj.positions[i + 0];
        const y = obj.positions[i + 1];
        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);

        obj.positions[i + 0] = -x;
        obj.positions[i + 1] = -y;

        if (obj.normals.length === 3) {
            if (i === 0) {
                obj.normals[0] *= -1;
                obj.normals[1] *= -1;
            }
        } else {
            obj.normals[i + 0] *= -1;
            obj.normals[i + 1] *= -1;
        }
    }
    translate(obj, maxX, maxY, 0);
}

export function Cuboid(width: number, depth: number, height: number): PrimitiveInfo {
    return {
        positions: [
            // 0 - 3
            0,     0, 0,
            width, 0, 0,
            width, 0, height,
            0,     0, height,

            // 4 - 7
            width, 0,     0,
            width, 0,     height,
            width, depth, 0,
            width, depth, height,

            // 8 - 11
            0,     depth, 0,
            width, depth, 0,
            width, depth, height,
            0,     depth, height,

            // 12 - 15
            0, 0,     0,
            0, 0,     height,
            0, depth, 0,
            0, depth, height,

            // 16 - 19
            0,         0, height,
            width,     0, height,
            width, depth, height,
            0,     depth, height,

            // 20 - 23
            0,         0, 0,
            width,     0, 0,
            width, depth, 0,
            0,     depth, 0,
        ],
        normals: [
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
        ],
        indexes: [
            0, 1, 2,
            0, 2, 3,

            4, 6, 5,
            5, 6, 7,

            8, 10, 9,
            8, 11, 10,

            12, 13, 14,
            13, 15, 14,

            16, 17, 18,
            16, 18, 19,

            20, 22, 21,
            20, 23, 22,
        ],
    }
}

export function XYPlane(width: number, depth: number): PrimitiveInfo {
    return {
        positions: [
            0, 0, 0,
            width, 0, 0,
            0, depth, 0,
            width, depth, 0,
        ],
        normals: [
            0, 0, 1,
        ],
        indexes: [
            0, 1, 2,
            2, 1, 3,
        ],
    }
}

export function XZPlane(width: number, height: number): PrimitiveInfo {
    return {
        positions: [
            0, 0, 0,
            width, 0, 0,
            0, 0, height,
            width, 0, height,
        ],
        normals: [
            0, -1, 0,
        ],
        indexes: [
            0, 1, 2,
            2, 1, 3,
        ],
    }
}

export function YZPlane(depth: number, height: number): PrimitiveInfo {
    return {
        positions: [
            0, 0, 0,
            0, 0, height,
            0, depth, 0,
            0, depth, height,
        ],
        normals: [
            -1, 0, 0,
        ],
        indexes: [
            0, 1, 2,
            2, 1, 3,
        ],
    }
}

export enum PlaneRotate {
    X, Y
}

export function Plane45deg(width: number, depth: number, height: number,
                           firstPointDown: boolean, rotate: PlaneRotate): PrimitiveInfo {
    const z1 = firstPointDown ? 0 : height;
    const z2 = rotate === PlaneRotate.Y ? (firstPointDown ? height : 0) : z1;
    const z3 = rotate === PlaneRotate.Y ? z1 : (firstPointDown ? height : 0);
    const z4 = rotate === PlaneRotate.Y ? z2 : z3;

    const n = 0.7071;
    const nx = rotate === PlaneRotate.Y ? n : 0;
    const ny = rotate === PlaneRotate.Y ? 0 : n;
    return {
        positions: [
            0, 0, z1,
            width, 0, z2,
            0, depth, z3,
            width, depth, z4,
        ],
        normals: [
            nx, ny, n,
        ],
        indexes: [
            0, 1, 2,
            2, 1, 3,
        ],
    }
}

export function Triangle(x2: number, y2: number, z2: number,
                         x3: number, y3: number, z3: number,
                         xn: number, yn: number, zn: number,): PrimitiveInfo {
    return {
        positions: [
            0, 0, 0,
            x2, y2, z2,
            x3, y3, z3,
        ],
        normals: [
            xn, yn, zn,
        ],
        indexes: [
            0, 1, 2,
        ],
    }
}

export function Pyramid(width: number, depth: number, height: number): PrimitiveInfo {
    const xAng = Math.atan(height / (width / 2)) + Math.PI / 2;
    const nx1 = Math.cos(xAng);
    const nz1 = Math.sin(xAng);

    const yAng = Math.atan(height / (depth / 2)) + Math.PI / 2;
    const ny2 = Math.cos(yAng);
    const nz2 = Math.sin(yAng);

    return {
        positions: [
            0, 0, 0,
            width, 0, 0,
            0, depth, 0,
            width, depth, 0,

            0, 0, 0,
            width / 2, depth / 2, height,
            0, depth, 0,

            width, 0, 0,
            width, depth, 0,
            width / 2, depth / 2, height,

            0, 0, 0,
            width, 0, 0,
            width / 2, depth / 2, height,

            0, depth, 0,
            width / 2, depth / 2, height,
            width, depth, 0,
        ],
        normals: [
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            nx1, 0, nz1,
            nx1, 0, nz1,
            nx1, 0, nz1,

            -nx1, 0, nz1,
            -nx1, 0, nz1,
            -nx1, 0, nz1,

            0, ny2, nz2,
            0, ny2, nz2,
            0, ny2, nz2,

            0, -ny2, nz2,
            0, -ny2, nz2,
            0, -ny2, nz2,
        ],
        indexes: [
            0, 1, 2,
            2, 1, 3,

            4, 5, 6,

            7, 8, 9,

            10, 11, 12,

            13, 14, 15,
        ],
    }
}