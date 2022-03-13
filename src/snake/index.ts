import {resizeContext} from "../WebGL/WebGLUtil";
import WebGLProgramContext from "../WebGL/WebGLProgramContext";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import IndexBuffer from "../WebGL/wrappers/IndexBuffer";
import Snake from "./Snake";

export enum Direction {
    UP, DOWN, LEFT, RIGHT
}

export default class SnakeController {
    static readonly width = 10;
    static readonly height = 20;
    static readonly fill = 0.4;

    el: HTMLCanvasElement;
    prog!: WebGLProgramContext;

    vertexBuffer = new DataBuffer(SnakeController.width * SnakeController.height * (8 + 8) * Float32Array.BYTES_PER_ELEMENT); // f64 points, pixel = 2 triangle = 4 points, grid = 4 lines = 4 points
    indexBuffer = new IndexBuffer(SnakeController.width * SnakeController.height * 8 * Uint16Array.BYTES_PER_ELEMENT); // UInt16 indexes. pixel = 2 triangle = 6 indexes, grid = 4 lines = 8 indexes

    glVertexBuffer!: WebGLBuffer;
    glIndexBuffer!: WebGLBuffer;

    snake!: Snake;
    apple!: [number, number];
    direction!: Direction;

    speed = 500; // ms

    constructor(el: HTMLCanvasElement) {
        this.el = el;

        this.initGLContext();
        this.initVertexBuffer();
        this.initGameField();
        this.drawNextFrame();
    }

    private initGLContext() {
        const vertexShaderCode = `
            attribute vec2 a_position;

            void main() {
              gl_Position = vec4(a_position, 0, 1);
            }
        `;
        const fragmentShaderCode = `
            precision mediump float;
            uniform vec3 u_color;
            
            void main() {
              gl_FragColor = vec4(u_color, 1.0);
            }
        `;
        this.prog = new WebGLProgramContext(this.el, vertexShaderCode, fragmentShaderCode,
            ['a_position'],
            ['u_color']);

        this.glVertexBuffer = this.prog.createBuffer()!;
        this.glIndexBuffer = this.prog.createBuffer()!;
    }

    private initVertexBuffer() {
        const pixelW = 2.0 / SnakeController.width;
        const pixelH = 2.0 / SnakeController.height;

        const offsetX = (pixelW * SnakeController.fill) / 2;
        const offsetY = (pixelH * SnakeController.fill) / 2;

        for (let y = 0; y < SnakeController.height; ++y) {
            for (let x = 0; x < SnakeController.width; ++x) {
                // square
                this.vertexBuffer.write2Float32((x + 0) * pixelW + offsetX - 1, (y + 0) * pixelH + offsetY - 1);
                this.vertexBuffer.write2Float32((x + 0) * pixelW + offsetX - 1, (y + 1) * pixelH - offsetY - 1);
                this.vertexBuffer.write2Float32((x + 1) * pixelW - offsetX - 1, (y + 1) * pixelH - offsetY - 1);
                this.vertexBuffer.write2Float32((x + 1) * pixelW - offsetX - 1, (y + 0) * pixelH + offsetY - 1);
                // border
                this.vertexBuffer.write2Float32((x + 0) * pixelW - 1, (y + 0) * pixelH - 1);
                this.vertexBuffer.write2Float32((x + 0) * pixelW - 1, (y + 1) * pixelH - 1);
                this.vertexBuffer.write2Float32((x + 1) * pixelW - 1, (y + 1) * pixelH - 1);
                this.vertexBuffer.write2Float32((x + 1) * pixelW - 1, (y + 0) * pixelH - 1);
            }
        }

        const gl = this.prog.gl;
        this.prog.useProgram();
        this.prog.arrayBuffer(this.glVertexBuffer, (2 * Float32Array.BYTES_PER_ELEMENT), {
            a_position: {elems: 2, elType: gl.FLOAT, normalized: false, offsetBytes: 0},
        }, this.vertexBuffer.sliceFloat32());
    }

    private static writePixelIndex(indexBuffer: IndexBuffer, x: number, y: number) {
        const start = (y * SnakeController.width + x) * 8;
        indexBuffer.write3Uint16(start, start + 1, start + 3);
        indexBuffer.write3Uint16(start + 1, start + 2, start + 3);
    }

    private static writeBorderIndex(indexBuffer: IndexBuffer, x: number, y: number) {
        const start = (y * SnakeController.width + x) * 8 + 4;
        indexBuffer.write2Uint16(start, start + 1);
        indexBuffer.write2Uint16(start + 1, start + 2);
        indexBuffer.write2Uint16(start + 2, start + 3);
        indexBuffer.write2Uint16(start + 3, start);
    }

    private static randomApple(snake: Snake): [number, number] {
        const max = SnakeController.width * SnakeController.height - snake.length;
        let p = Math.round(Math.random() * max);
        for (let y = 0; y < SnakeController.height; ++y) {
            for (let x = 0; x < SnakeController.width; ++x) {
                if (!snake.isSnake(x, y, false)) {
                    if (p === 0) {
                        return [x, y];
                    }
                    --p;
                }
            }
        }
        return [
            Math.trunc(Math.random() * SnakeController.width),
            Math.trunc(Math.random() * SnakeController.height),
        ];
    }

    private static nextSnakeHead(snake: Snake, direction: Direction): [number, number] {
        const dx = direction == Direction.LEFT ? -1 : (direction == Direction.RIGHT ? 1 : 0);
        const dy = -(direction == Direction.UP ? -1 : (direction == Direction.DOWN ? 1 : 0)); // revert to WebGL coords

        const head = snake.head;
        const x = (head[0] + dx) % SnakeController.width;
        const y = (head[1] + dy) % SnakeController.height;
        return [
            x < 0 ? (x + SnakeController.width) : x,
            y < 0 ? (y + SnakeController.height) : y,
        ];
    }

    private initGameField() {
        this.snake = new Snake(Math.round(SnakeController.width / 2), Math.round(SnakeController.height / 2));
        this.direction = Direction.UP;
        this.apple = SnakeController.randomApple(this.snake);
    }

    private updateGameField() {
        const next = SnakeController.nextSnakeHead(this.snake, this.direction);
        if (next[0] === this.apple[0] && next[1] === this.apple[1]) {
            this.snake.add(next[0], next[1]);
            this.apple = SnakeController.randomApple(this.snake);
        } else if (this.snake.isSnake(...next, true)) {
            this.initGameField();
        } else {
            this.snake.move(next[0], next[1]);
        }
    }

    private drawNextFrame() {
        setTimeout(this.drawNextFrame.bind(this), this.speed);

        this.updateGameField();

        const gl = this.prog.gl;
        resizeContext(gl);
        gl.clearColor(137.0 / 255.0, 151.0 / 255.0, 116.0 / 255.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.prog.useProgram();

        // draw empty field
        {
            this.prog.uniformVector('u_color', 131.0 / 255.0, 141.0 / 255.0, 114.0 / 255.0);

            this.indexBuffer.clean();
            for (let y = 0; y < SnakeController.height; ++y) {
                for (let x = 0; x < SnakeController.width; ++x) {
                    SnakeController.writePixelIndex(this.indexBuffer, x, y);
                }
            }
            this.prog.indexBuffer(this.glIndexBuffer, this.indexBuffer.sliceUint16());
            this.prog.drawElements(gl.TRIANGLES, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);

            this.indexBuffer.clean();
            for (let y = 0; y < SnakeController.height; ++y) {
                for (let x = 0; x < SnakeController.width; ++x) {
                    SnakeController.writeBorderIndex(this.indexBuffer, x, y);
                }
            }
            this.prog.indexBuffer(this.glIndexBuffer, this.indexBuffer.sliceUint16());
            this.prog.drawElements(gl.LINES, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);
        }

        // draw snake and apple
        {
            this.prog.uniformVector('u_color', 0, 0, 0);

            this.indexBuffer.clean();
            for (const p of this.snake) {
                SnakeController.writePixelIndex(this.indexBuffer, p[0], p[1]);
            }
            SnakeController.writePixelIndex(this.indexBuffer, this.apple[0], this.apple[1]);
            this.prog.indexBuffer(this.glIndexBuffer, this.indexBuffer.sliceUint16());
            this.prog.drawElements(gl.TRIANGLES, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);

            this.indexBuffer.clean();
            for (const p of this.snake) {
                SnakeController.writeBorderIndex(this.indexBuffer, p[0], p[1]);
            }
            SnakeController.writeBorderIndex(this.indexBuffer, this.apple[0], this.apple[1]);
            this.prog.indexBuffer(this.glIndexBuffer, this.indexBuffer.sliceUint16());
            this.prog.drawElements(gl.LINES, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);
        }
    }

    public setDirection(d: Direction) {
        const next = SnakeController.nextSnakeHead(this.snake, d);
        if (!this.snake.isSnake(...next, true)) {
            this.direction = d;
        }
    }
}
