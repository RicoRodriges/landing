export type VertexIndex = [number, number, number]; // indexes of [pos, tex, normal]

export type Geometry = {
    name?: string,
    material?: string,
    triangles: [VertexIndex, VertexIndex, VertexIndex][],
};

export default class OBJ {
    // because indices are base 1 let's just fill in the 0th data
    positions: [number, number, number][] = [[0, 0, 0]];
    texcoords: [number, number][] = [[0, 0]];
    normals: [number, number, number][] = [[0, 0, 0]];
    geometries: Geometry[] = [];

    // https://free3d.com/3d-model/cartoon-mill-on-island-low-poly-25625.html
    // https://webglfundamentals.org/webgl/lessons/webgl-load-obj-w-mtl.html
    // http://paulbourke.net/dataformats/obj/
    public static parse(text: string): OBJ {
        const result = new OBJ();

        let current: Geometry | null = null;

        function newGeometry() {
            if (current && current.triangles.length) {
                if (!current.name && result.geometries.length > 1) {
                    const prev = result.geometries[result.geometries.length - 2];
                    current.name = prev.name;
                }
                current = null;
            }
        }

        function currentGeometry(): Geometry {
            if (current === null) {
                const geometry: Geometry = {
                    triangles: [],
                };

                result.geometries.push(geometry);
                current = geometry;
            }
            return current;
        }

        function toVertexIndex(vert: string): VertexIndex {
            const indexes = vert.split('/');
            // TODO: hack
            if (indexes.length === 2) indexes.push("0");
            if (indexes.length !== 3) throw new Error(`Expected 3 vertex indexes like '1/1/1'. Found ${indexes.length} indexes: ${vert}`);

            const vertex = indexes.map(v => parseInt(v)) as VertexIndex;
            if (vertex.some(v => isNaN(v))) throw new Error(`Vertex indexes '${vert}' is not supported`);
            return vertex;
        }

        const keywords: { [k: string]: (a1: string[], orig: string) => void } = {
            v(coord) {
                if (coord.length !== 3) throw new Error(`'v' command has ${coord.length} coordinates. Expected 3`);
                result.positions.push(coord.map(v => parseFloat(v)) as [number, number, number])
            },
            vn(coord) {
                if (coord.length !== 3) throw new Error(`'vn' command has ${coord.length} coordinates. Expected 3`);
                result.normals.push(coord.map(v => parseFloat(v)) as [number, number, number])
            },
            vt(coord) {
                if (coord.length < 2) throw new Error(`'vt' command has ${coord.length} coordinates. Expected at least 2`);
                result.texcoords.push(coord.map(v => parseFloat(v)).slice(0, 2) as [number, number])
            },
            f(vertexes) {
                const g = currentGeometry();
                const numTriangles = vertexes.length - 2;
                for (let tri = 0; tri < numTriangles; ++tri) {
                    g.triangles.push([
                        toVertexIndex(vertexes[0]),
                        toVertexIndex(vertexes[tri + 1]),
                        toVertexIndex(vertexes[tri + 2]),
                    ]);
                }
            },
            s() {
            },
            mtllib() {
            },
            usemtl(_, unparsedArgs) {
                newGeometry();
                currentGeometry().material = unparsedArgs;
            },
            g() {
                newGeometry();
            },
            o(_, unparsedArgs) {
                newGeometry();
                currentGeometry().name = unparsedArgs;
            },
        };

        const keywordRE = /(\w+)\s+(.*)/;
        for (const line of text.split('\n').map(v => v.trim())) {
            if (line === '' || line.startsWith('#')) {
                continue;
            }
            const m = keywordRE.exec(line);
            if (!m) {
                continue;
            }
            const [, keyword, unparsedArgs] = m;
            const parts = line.split(/\s+/).slice(1);
            const handler = keywords[keyword];
            if (!handler) {
                console.debug('unhandled keyword:', keyword);
                continue;
            }
            handler(parts, unparsedArgs);
        }

        result.geometries = result.geometries.filter(g => g.triangles.length > 0);
        return result;
    }

    public getPositionOf(v: VertexIndex) {
        return this.positions[v[0]];
    }

    public getNormalOf(v: VertexIndex) {
        return this.normals[v[2]];
    }

    public getSize() {
        const result = {
            min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] as [number, number, number],
            max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY] as [number, number, number],
        };
        for (const g of this.geometries) {
            for (const t of g.triangles) {
                for (const v of t) {
                    const pos = this.getPositionOf(v);
                    for (let i = 0; i < 3; ++i) {
                        result.min[i] = Math.min(pos[i], result.min[i]);
                        result.max[i] = Math.max(pos[i], result.max[i]);
                    }
                }
            }
        }
        return result;
    }

    public getTriangleCount() {
        return this.geometries.reduce((n, g) => n + g.triangles.length, 0)
    }
};
