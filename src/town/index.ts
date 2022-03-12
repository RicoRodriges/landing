import {isVisible, resizeContext} from "../WebGL/WebGLUtil";
import {calcHeight, Color, DebugFloor, House, PALLETS, Road, RoadDirection, TownObject, Tree} from "./town-objects";
import Matrix4 from "../WebGL/Matrix4";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import IndexBuffer from "../WebGL/wrappers/IndexBuffer";
import WebGLProgramContext from "../WebGL/WebGLProgramContext";

// original idea is https://codepen.io/smlsvnssn/pen/ZrVEaL

export default class TownController {
    readonly el: HTMLCanvasElement;
    readonly bgColor: Color;

    glProg!: WebGLProgramContext;

    grid: TownObject[][][] = [];

    readonly gridWidth: number;
    readonly gridHeight: number;
    readonly gridSize = 200;
    readonly maxHeight = 600;
    readonly minHeight = 100;

    readonly heightFactor: number; // 0.5 - all buildings are high, 1 - middle, 2 - all buildings are low, ...
    readonly roads: number;
    readonly population: number;
    readonly vegetation: number;

    vertexBuffer = new DataBuffer(1);
    indexBuffer = new IndexBuffer(1);
    staticTriangles = 0;

    glVertexBuffer!: WebGLBuffer;
    glIndexBuffer!: WebGLBuffer;

    glDynamicVertexBuffer!: WebGLBuffer;
    glDynamicIndexBuffer!: WebGLBuffer;

    cameraRotation = 0
    rotationSpeed = Math.PI / 1000

    paused = false;

    constructor(canvas: HTMLCanvasElement, bgColor: Color, width: number, height: number, depth: number, roads: number,
                population: number, vegetation: number) {
        this.el = canvas;
        this.bgColor = bgColor;
        this.gridWidth = width;
        this.gridHeight = depth;
        this.heightFactor = 5 / height; // 1 - 10
        this.roads = roads;
        this.population = Math.min(population / 10, 1);
        this.vegetation = Math.min(vegetation / 10, 1);

        this.initGLContext();
        this.generateGrid();
        this.fillStaticBuffers();

        this.drawNextFrame();
    }

    private initGLContext() {
        const vertexShaderCode = `
            attribute vec4 a_position;
            attribute vec3 a_normal;
            attribute vec4 a_color;

            uniform mat4 u_worldMatrix;
            uniform mat4 u_worldProjectionMatrix;

            varying vec4 v_color;
            varying vec3 v_normal;

            void main() {
              gl_Position = u_worldProjectionMatrix * a_position;
              v_color = a_color;
              v_normal = mat3(u_worldMatrix) * a_normal;
            }
        `;
        const fragmentShaderCode = `
            #ifdef GL_FRAGMENT_PRECISION_HIGH
                precision highp float;
            #else
                precision mediump float;
            #endif
            
            uniform vec3 u_lightDirection;

            varying vec4 v_color;
            varying vec3 v_normal;

            void main() {
                vec3 normal = normalize(v_normal);
                vec3 lightDirection = normalize(u_lightDirection);
                
                float light = dot(normal, -lightDirection);
            
                gl_FragColor = v_color;
                gl_FragColor.rgb *= light;
            }
        `;

        this.glProg = new WebGLProgramContext(this.el, vertexShaderCode, fragmentShaderCode,
            ['a_position', 'a_normal', 'a_color'],
            ['u_worldMatrix', 'u_worldProjectionMatrix', 'u_lightDirection']
        );

        this.glProg.gl.enable(this.glProg.gl.CULL_FACE);
        this.glProg.gl.cullFace(this.glProg.gl.BACK);
        this.glProg.gl.enable(this.glProg.gl.DEPTH_TEST);

        this.glVertexBuffer = this.glProg.createBuffer()!;
        this.glIndexBuffer = this.glProg.createBuffer()!;
        this.glDynamicVertexBuffer = this.glProg.createBuffer()!;
        this.glDynamicIndexBuffer = this.glProg.createBuffer()!;
    }

    private generateGrid() {
        // this.gridWidth = Math.ceil(this.el.clientWidth / this.gridSize) + 3;
        // this.gridHeight = Math.ceil(this.el.clientHeight / this.gridSize) + 3;

        const randColor = () => PALLETS[Math.trunc(Math.random() * PALLETS.length)];

        this.grid = [];
        for (let x = 0; x < this.gridWidth; ++x) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridHeight; ++y) {
                this.grid[x][y] = [];

                // this.grid[x][y].push(new DebugFloor(this.gridSize));
                if (Math.random() <= this.population) {
                    this.grid[x][y].push(new House(this.gridSize, calcHeight(x, y, this.gridWidth, this.gridHeight, this.heightFactor, this.maxHeight, this.minHeight), randColor()));
                } else if (Math.random() <= this.vegetation) {
                    this.grid[x][y].push(new Tree(this.gridSize));
                }
            }
        }

        const xRoads = new Set<number>();
        const yRoads = new Set<number>();
        for (let i = 0; i < this.roads; i += 2) {
            const xOrig = Math.trunc(Math.random() * this.gridWidth);
            for (let d = 0; d < this.gridWidth; ++d) {
                const x = (xOrig + d) % this.gridWidth;
                if (xRoads.has(x) || xRoads.has(x - 1) || xRoads.has(x + 1)) continue;
                xRoads.add(x);
                break;
            }
        }
        for (let i = 1; i < this.roads; i += 2) {
            const yOrig = Math.trunc(Math.random() * this.gridHeight);
            for (let d = 0; d < this.gridHeight; ++d) {
                const y = (yOrig + d) % this.gridHeight;
                if (yRoads.has(y) || yRoads.has(y - 1) || yRoads.has(y + 1)) continue;
                yRoads.add(y);
                break;
            }
        }

        for (const y of yRoads) {
            for (let x = 0; x < this.gridWidth; ++x) {
                this.grid[x][y] = [new Road(this.gridSize, RoadDirection.X)];
            }
        }
        for (const x of xRoads) {
            for (let y = 0; y < this.gridHeight; ++y) {
                this.grid[x][y] = [new Road(this.gridSize, RoadDirection.Y)];
            }
        }
        for (const y of yRoads) {
            for (const x of xRoads) {
                this.grid[x][y] = [new Road(this.gridSize, RoadDirection.LINK)];
            }
        }
    }

    private static reserveBuffers(vertex: DataBuffer, index: IndexBuffer, triangles: number) {
        // approximated values
        // triangle = 3 vertexes * (xyz + normal + rgba)
        vertex.reserveAndClean(triangles * 3 * (3 * Float32Array.BYTES_PER_ELEMENT + 3 * Float32Array.BYTES_PER_ELEMENT + 4));
        // triangle = 3 vertexes indexes
        index.reserveAndClean(triangles * 3 * Uint16Array.BYTES_PER_ELEMENT);
    }

    private static bindArrayBuffer(glProg: WebGLProgramContext, buf: WebGLBuffer, vertex?: DataBuffer) {
        const gl = glProg.gl;
        const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
        glProg.arrayBuffer(buf, 6 * FLOAT_SIZE + 4, {
            a_position: {elems: 3, elType: gl.FLOAT, normalized: false, offsetBytes: 0},
            a_normal: {elems: 3, elType: gl.FLOAT, normalized: false, offsetBytes: 3 * FLOAT_SIZE},
            a_color: {elems: 4, elType: gl.UNSIGNED_BYTE, normalized: true, offsetBytes: 6 * FLOAT_SIZE},
        }, vertex?.sliceFloat32());
    }

    private static bindIndexBuffer(glProg: WebGLProgramContext, buf: WebGLBuffer, index?: IndexBuffer) {
        glProg.indexBuffer(buf, index?.sliceUint16());
    }

    private static writeBuffers(vertex: DataBuffer, index: IndexBuffer, grid: TownObject[][][], gridSize: number,
                                 draw: (o: TownObject, v: DataBuffer, i: IndexBuffer) => void) {
        grid.forEach((gridY, x) =>
            gridY.forEach((objs, y) => {

                const oldOffset = vertex.bytes;
                objs.forEach((o) => draw(o, vertex, index));

                // update X and Y offsets
                if (vertex.bytes > oldOffset) {
                    // buffer was changed
                    const slice = vertex.sliceFloat32(oldOffset);
                    for (let i = 0; i < slice.length; i += 7) {
                        slice[i + 0] += gridSize * x;
                        slice[i + 1] += gridSize * y;
                    }
                }
            })
        );
    }

    private fillStaticBuffers() {
        const triangles = this.grid
            .flatMap(x => x)
            .flatMap(x => x)
            .reduce((p, obj) => p + obj.getTriangleCount(), 0);

        TownController.reserveBuffers(this.vertexBuffer, this.indexBuffer, triangles);
        TownController.writeBuffers(this.vertexBuffer, this.indexBuffer, this.grid, this.gridSize,
            (o, v, i) => o.writeObject(v, i));

        this.glProg.useProgram();
        TownController.bindArrayBuffer(this.glProg, this.glVertexBuffer, this.vertexBuffer);
        TownController.bindIndexBuffer(this.glProg, this.glIndexBuffer, this.indexBuffer);
        this.staticTriangles = this.indexBuffer.bytes / 2;
    }

    private drawNextFrame() {
        if (this.paused) return;

        window.requestAnimationFrame(this.drawNextFrame.bind(this));

        const gl = this.glProg.gl;
        if (!isVisible(gl)) return;
        resizeContext(gl);
        gl.clearColor(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let triangles = 0;
        this.grid.forEach((gridY) =>
            gridY.forEach((objs) =>
                objs.forEach((o) => {
                    o.frameUpdate();
                    triangles += o.getDynamicTriangleCount();
                })
            )
        );

        TownController.reserveBuffers(this.vertexBuffer, this.indexBuffer, triangles);
        TownController.writeBuffers(this.vertexBuffer, this.indexBuffer, this.grid, this.gridSize,
            (o, v, i) => o.writeDynamicObject(v, i));

        this.glProg.useProgram();

        {
            this.cameraRotation -= this.rotationSpeed;
            if (this.cameraRotation < -Math.PI * 2) {
                this.cameraRotation = 0;
            }

            // center of our coordinate system. We need to transform in into WebGL [-1;1] coordinates
            // meanX and meanY must be 0 (center) in WebGL
            const meanX = this.gridWidth * this.gridSize / 2;
            const meanY = this.gridHeight * this.gridSize / 2;

            // Calculate view matrix
            const diameter = Math.max(this.gridWidth, this.gridHeight) * this.gridSize;
            const radius = diameter / 2;
            const eyeX = Math.sin(this.cameraRotation) * diameter + radius;
            const eyeY = -Math.cos(this.cameraRotation) * diameter + radius;
            const eyeZ = radius;
            const viewMatrix = Matrix4.LookAt(eyeX, eyeY, eyeZ, meanX, meanY, 0, 0, 0, 1);

            // Projection matrix. Here we transform our system -> WebGL coordinates
            const worldProjectionMatrix = Matrix4.Ortho(
                -this.glProg.width, this.glProg.width,
                -this.glProg.height, this.glProg.height,
                -10000, 10000
            );
            worldProjectionMatrix.multiply(viewMatrix);

            this.glProg.uniformMatrix('u_worldMatrix', viewMatrix.data);
            this.glProg.uniformMatrix('u_worldProjectionMatrix', worldProjectionMatrix.data);
            this.glProg.uniformVector('u_lightDirection', -0.2, -0.5, -1);
        }

        TownController.bindArrayBuffer(this.glProg, this.glVertexBuffer);
        TownController.bindIndexBuffer(this.glProg, this.glIndexBuffer);
        this.glProg.drawElements(gl.TRIANGLES, this.staticTriangles, gl.UNSIGNED_SHORT);

        TownController.bindArrayBuffer(this.glProg, this.glDynamicVertexBuffer, this.vertexBuffer);
        TownController.bindIndexBuffer(this.glProg, this.glDynamicIndexBuffer, this.indexBuffer);
        this.glProg.drawElements(gl.TRIANGLES, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);
    }

    public detach() {
        this.paused = true;
        this.glProg.deleteBuffer(this.glVertexBuffer);
        this.glProg.deleteBuffer(this.glIndexBuffer);
        this.glProg.deleteBuffer(this.glDynamicVertexBuffer);
        this.glProg.deleteBuffer(this.glDynamicIndexBuffer);
        this.glProg.destroyProgram();
    }
}
