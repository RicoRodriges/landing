import Matrix4 from "../WebGL/Matrix4";
import WebGLProgramContext from "../WebGL/WebGLProgramContext";
import { isVisible, resizeContext } from "../WebGL/WebGLUtil";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import { Action } from "./Action";
import { Direction } from "./Direction";
import Maze from "./Maze";
import Runner from "./Runner";

enum Primitive {
    LEFT_WALL,
    RIGHT_WALL,
    UP_WALL,
    DOWN_WALL,
    FLOOR,
    CEIL,
}

export default class MazeController {
    private static readonly CELL_SIZE = 100;
    private static readonly SPRITE_WALL = [0, 0, 128 / 192, 1];
    private static readonly SPRITE_FLOOR = [128 / 192, 0, 1, 0.5];
    private static readonly SPRITE_CEIL = [128 / 192, 0.5, (128 + 33) / 192, (64 + 33) / 128];

    private maze!: Maze;
    private runner!: Runner;

    private el: HTMLCanvasElement;
    private prog!: WebGLProgramContext;

    private vertexBuffer = new DataBuffer(Uint8Array.BYTES_PER_ELEMENT * 4); // 4 corner vertex ids
    private instanceCellBuffer = new DataBuffer(1);
    private instanceTypeBuffer = new DataBuffer(1);

    private glVertexBuffer!: WebGLBuffer;
    private glInstanceCellBuffer!: WebGLBuffer;
    private glInstanceTypeBuffer!: WebGLBuffer;
    private glTexture!: WebGLTexture;

    public constructor(el: HTMLCanvasElement, w: number, h: number, spriteUrl: string, auto: boolean) {
        this.el = el;

        this.initGLContext();
        this.initStaticBuffers(spriteUrl);
        this.initNewGameField(w, h, auto);
        this.drawNextFrame();
    }

    private initGLContext() {
        const cellSize = MazeController.CELL_SIZE;
        const wallSprite = MazeController.SPRITE_WALL;
        const ceilSprite = MazeController.SPRITE_CEIL;
        const floorSprite = MazeController.SPRITE_FLOOR;
        const LEFT = -cellSize/2, BOTTOM = -cellSize/2, DOWN = -cellSize/2;
        const RIGHT = cellSize/2, TOP = cellSize/2, UP = cellSize/2;
        const vertexShaderCode = `
            attribute float a_vertexID; // 4 corners
            attribute vec2 a_cellIndex; // [0..i]
            attribute float a_type; // Primitive enum

            uniform mat4 u_worldProjectionMatrix;

            varying vec2 v_texcoord;

            bool equals(float v1, int v2) {
                return abs(v1 - float(v2)) < 0.0001;
            }

            vec4 position() {
              int index = int(a_vertexID);
              if (equals(a_type, ${Primitive.UP_WALL})) {
                ${[[LEFT, BOTTOM], [RIGHT, BOTTOM], [LEFT, TOP], [RIGHT, TOP]].map((v, i) => {
                    return `if (index == ${i}) return vec4(${v[0]}, ${v[1]}, ${UP}, 1);`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.LEFT_WALL})) {
                ${[[DOWN, BOTTOM], [UP, BOTTOM], [DOWN, TOP], [UP, TOP]].map((v, i) => {
                    return `if (index == ${i}) return vec4(${LEFT}, ${v[1]}, ${v[0]}, 1);`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.RIGHT_WALL})) {
                ${[[UP, BOTTOM], [DOWN, BOTTOM], [UP, TOP], [DOWN, TOP]].map((v, i) => {
                    return `if (index == ${i}) return vec4(${RIGHT}, ${v[1]}, ${v[0]}, 1);`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.DOWN_WALL})) {
                ${[[RIGHT, BOTTOM], [LEFT, BOTTOM], [RIGHT, TOP], [LEFT, TOP]].map((v, i) => {
                    return `if (index == ${i}) return vec4(${v[0]}, ${v[1]}, ${DOWN}, 1);`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.CEIL})) {
                ${[[LEFT, UP], [RIGHT, UP], [LEFT, DOWN], [RIGHT, DOWN]].map((v, i) => {
                    return `if (index == ${i}) return vec4(${v[0]}, ${TOP}, ${v[1]}, 1);`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.FLOOR})) {
                ${[[LEFT, DOWN], [RIGHT, DOWN], [LEFT, UP], [RIGHT, UP]].map((v, i) => {
                    return `if (index == ${i}) return vec4(${v[0]}, ${BOTTOM}, ${v[1]}, 1);`;
                }).join(' else ')}
              }
              // fallback, never happens
              return vec4(0, 0, 0, 1);
            }

            vec2 texcoord() {
              int index = int(a_vertexID);
              if (equals(a_type, ${Primitive.UP_WALL}) || equals(a_type, ${Primitive.LEFT_WALL}) || equals(a_type, ${Primitive.RIGHT_WALL}) || equals(a_type, ${Primitive.DOWN_WALL})) {
                ${[[wallSprite[0], wallSprite[3]], [wallSprite[2], wallSprite[3]], [wallSprite[0], wallSprite[1]], [wallSprite[2], wallSprite[1]]].map((v, i) => {
                    return `if (index == ${i}) return vec2(${v[0]}, ${v[1]});`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.CEIL})) {
                ${[[ceilSprite[0], ceilSprite[3]], [ceilSprite[2], ceilSprite[3]], [ceilSprite[0], ceilSprite[1]], [ceilSprite[2], ceilSprite[1]]].map((v, i) => {
                    return `if (index == ${i}) return vec2(${v[0]}, ${v[1]});`;
                }).join(' else ')}
              } else if (equals(a_type, ${Primitive.FLOOR})) {
                ${[[floorSprite[0], floorSprite[3]], [floorSprite[2], floorSprite[3]], [floorSprite[0], floorSprite[1]], [floorSprite[2], floorSprite[1]]].map((v, i) => {
                    return `if (index == ${i}) return vec2(${v[0]}, ${v[1]});`;
                }).join(' else ')}
              }
              // fallback, never happens
              return vec2(0, 0);
            }

            void main() {
              vec2 offset = a_cellIndex * vec2(${cellSize}, ${cellSize});
              gl_Position = u_worldProjectionMatrix * (position() + vec4(offset.x, 0, offset.y, 0)) * vec4(-1, 1, 1, 1);

              v_texcoord = texcoord();
            }
        `;
        const fragmentShaderCode = `
            precision mediump float;
            
            uniform sampler2D u_texture;
            varying vec2 v_texcoord;
            
            void main() {
              gl_FragColor = texture2D(u_texture, v_texcoord);
            }
        `;
        this.prog = new WebGLProgramContext(this.el, vertexShaderCode, fragmentShaderCode,
            ['a_vertexID', 'a_cellIndex', 'a_type'],
            ['u_worldProjectionMatrix', 'u_texture']);

        this.prog.gl.enable(this.prog.gl.CULL_FACE);
        this.prog.gl.enable(this.prog.gl.DEPTH_TEST);

        this.glVertexBuffer = this.prog.createBuffer()!;
        this.glInstanceCellBuffer = this.prog.createBuffer()!;
        this.glInstanceTypeBuffer = this.prog.createBuffer()!;
        this.glTexture = this.prog.createTexture()!;
    }

    private initStaticBuffers(spriteUrl: string) {
        const gl = this.prog.gl;
        this.prog.useProgram();

        // static vertex buffer
        this.vertexBuffer.write2Uint8(0, 1);
        this.vertexBuffer.write2Uint8(2, 3);
        this.prog.arrayBuffer(this.glVertexBuffer, Uint8Array.BYTES_PER_ELEMENT, {
            a_vertexID: {elems: 1, elType: gl.UNSIGNED_BYTE, normalized: false, offsetBytes: 0},
        }, this.vertexBuffer.rawBuffer);

        // temp texture
        this.prog.textureFromBuf('u_texture', this.glTexture, gl.RGB, new Uint8Array([0, 0, 0, 0]), 1, 1, gl.UNSIGNED_BYTE, 0, true);

        // texture
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            this.prog.textureFromImg('u_texture', this.glTexture, gl.RGB, image, gl.UNSIGNED_BYTE, 0, {
                generate: false, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE, minFilter: gl.NEAREST, magFilter: gl.NEAREST,
            });
        }
        image.src = spriteUrl;
    }

    private drawNextFrame() {
        window.requestAnimationFrame(this.drawNextFrame.bind(this));

        const gl = this.prog.gl;
        if (!isVisible(gl)) return;
        resizeContext(gl);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.runner.update();

        {
            let rotate = (Math.PI / 2) * this.runner.getRotateProgress() / 100;
            switch (this.runner.getDirection()) {
                case Direction.North:
                    rotate += 0;
                    break;
                case Direction.South:
                    rotate += Math.PI;
                    break;
                case Direction.West:
                    rotate += Math.PI / 2;
                    break;
                case Direction.East:
                    rotate += Math.PI + Math.PI / 2;
                    break;
            }

            let [dx, dz] = this.runner.getCurrentCell().map(v => v * MazeController.CELL_SIZE);
            switch (this.runner.getDirection()) {
                case Direction.North:
                    dz += MazeController.CELL_SIZE * this.runner.getMoveProgress() / 100;
                    break;
                case Direction.South:
                    dz -= MazeController.CELL_SIZE * this.runner.getMoveProgress() / 100;
                    break;
                case Direction.West:
                    dx -= MazeController.CELL_SIZE * this.runner.getMoveProgress() / 100;
                    break;
                case Direction.East:
                    dx += MazeController.CELL_SIZE * this.runner.getMoveProgress() / 100;
                    break;
            }

            // View matrix. Here we translate and rotate game field
            const viewMatrix = Matrix4.LookAt(dx, 0, dz, dx - Math.sin(rotate), 0, dz + Math.cos(rotate), 0, 1, 0);

            // Projection matrix. Here we transform our system -> WebGL coordinates
            const worldProjectionMatrix = Matrix4.Perspective(
                Math.PI * 3 / 5,
                this.prog.width / this.prog.height,
                1, Math.max(this.maze.getWidth(), this.maze.getHeight()) * MazeController.CELL_SIZE
            );
            worldProjectionMatrix.multiply(viewMatrix);
            this.prog.uniformMatrix('u_worldProjectionMatrix', worldProjectionMatrix.data);
        }

        this.prog.drawArraysInstanced(gl.TRIANGLE_STRIP, 4, this.instanceTypeBuffer.bytes);
    }

    public initNewGameField(w: number, h: number, auto: boolean) {
        this.maze = new Maze(w, h);
        this.runner = new Runner(this.maze, auto);

        const primitiveMap: Array<[Direction, Primitive]> = [
            [Direction.North, Primitive.UP_WALL],
            [Direction.South, Primitive.DOWN_WALL],
            [Direction.West, Primitive.LEFT_WALL],
            [Direction.East, Primitive.RIGHT_WALL],
        ];

        let entities = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                entities += 2; // floor and ceil
                for (const d of primitiveMap) {
                    if (this.maze.hasWall(x, y, d[0])) {
                        ++entities;
                    }
                }
            }
        }

        this.instanceCellBuffer.reserveAndClean(Uint16Array.BYTES_PER_ELEMENT * 2 * entities);
        this.instanceTypeBuffer.reserveAndClean(Uint8Array.BYTES_PER_ELEMENT * entities);
        // walls
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                for (const d of primitiveMap) {
                    if (this.maze.hasWall(x, y, d[0])) {
                        this.instanceCellBuffer.write2Uint16(x, y);
                        this.instanceTypeBuffer.write1Uint8(d[1]);
                    }
                }
            }
        }
        // floor and ceil
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                this.instanceCellBuffer.write2Uint16(x, y);
                this.instanceCellBuffer.write2Uint16(x, y);
                this.instanceTypeBuffer.write1Uint8(Primitive.CEIL);
                this.instanceTypeBuffer.write1Uint8(Primitive.FLOOR);
            }
        }

        const gl = this.prog.gl;

        this.prog.arrayBuffer(this.glInstanceCellBuffer, (2 * Uint16Array.BYTES_PER_ELEMENT), {
            a_cellIndex: {elems: 2, elType: gl.UNSIGNED_SHORT, normalized: false, offsetBytes: 0},
        }, this.instanceCellBuffer.rawBuffer);
        this.prog.markAttributeInstanced('a_cellIndex');

        this.prog.arrayBuffer(this.glInstanceTypeBuffer, (Uint8Array.BYTES_PER_ELEMENT), {
            a_type: {elems: 1, elType: gl.UNSIGNED_BYTE, normalized: false, offsetBytes: 0},
        }, this.instanceTypeBuffer.rawBuffer);
        this.prog.markAttributeInstanced('a_type');
    }

    public setAction(a: Action) {
        this.runner.setAction(a);
    }

    public setAuto(b: boolean) {
        this.runner.setAuto(b);
    }

    public get visible() {
        return isVisible(this.prog.gl);
    }
}