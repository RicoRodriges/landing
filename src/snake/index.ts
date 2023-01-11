import {isVisible, resizeContext} from "../WebGL/WebGLUtil";
import WebGLProgramContext from "../WebGL/WebGLProgramContext";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import IndexBuffer from "../WebGL/wrappers/IndexBuffer";
import Snake from "./Snake";

export enum Direction {
    UP, DOWN, LEFT, RIGHT
}

export default class SnakeController {
    private static readonly BACKGROUND: [number, number, number] = [137.0 / 255.0, 151.0 / 255.0, 116.0 / 255.0];
    private static readonly EMPTY_CELL: [number, number, number] = [131.0 / 255.0, 141.0 / 255.0, 114.0 / 255.0];
    private static readonly ACTIVE_CELL: [number, number, number] = [0, 0, 0];
    static readonly width = 10;
    static readonly height = 20;
    static readonly speed_max = 100;
    static readonly speed_delta = 30;

    el: HTMLCanvasElement;
    prog!: WebGLProgramContext;

    vertexBuffer = new DataBuffer(Float32Array.BYTES_PER_ELEMENT * 2 * 4); // 4 corners, corner = 2 coordinates
    instanceOffsetBuffer = new DataBuffer(SnakeController.width * SnakeController.height * (Uint8Array.BYTES_PER_ELEMENT * 2)); // (x_i, y_i) indexes
    instanceColorBuffer = new DataBuffer(SnakeController.width * SnakeController.height * (Uint8Array.BYTES_PER_ELEMENT)); // isActive

    glVertexBuffer!: WebGLBuffer;
    glInstanceOffsetBuffer!: WebGLBuffer;
    glInstanceColorBuffer!: WebGLBuffer;

    snake!: Snake;
    apple!: [number, number];
    direction!: Direction;
    speed!: number; // ms

    constructor(el: HTMLCanvasElement) {
        this.el = el;

        this.initGLContext();
        this.initBuffersAndUniform();
        this.initGameField();
        this.drawNextFrame();
    }

    private initGLContext() {
        const vertexShaderCode = `
            attribute vec2 a_position; // [0..+oo]
            attribute vec2 a_cellIndex; // [0..i]
            attribute float a_active; // 0 or 1

            uniform vec2 u_padding;
            uniform vec2 u_cellSize;

            varying float v_active;

            void main() {
              vec2 offsetFromTopLeftCorner = a_cellIndex * u_cellSize;
              vec2 padding = u_padding * vec2(a_position.x == 0.0 ? 1 : -1, a_position.y == 0.0 ? -1 : 1);
              vec2 position = vec2(-1, 1) + offsetFromTopLeftCorner + a_position + padding;
              gl_Position = vec4(position * vec2(1, -1), 0, 1);
              
              v_active = a_active;
            }
        `;
        const fragmentShaderCode = `
            precision mediump float;
            varying float v_active;
            
            void main() {
              if (v_active > 0.5) {
                gl_FragColor = vec4(${SnakeController.ACTIVE_CELL[0]}, ${SnakeController.ACTIVE_CELL[1]}, ${SnakeController.ACTIVE_CELL[2]}, 1.0);
              } else {
                gl_FragColor = vec4(${SnakeController.EMPTY_CELL[0]}, ${SnakeController.EMPTY_CELL[1]}, ${SnakeController.EMPTY_CELL[2]}, 1.0);
              }
            }
        `;
        this.prog = new WebGLProgramContext(this.el, vertexShaderCode, fragmentShaderCode,
            ['a_position', 'a_cellIndex', 'a_active'],
            ['u_padding', 'u_cellSize']);

        this.glVertexBuffer = this.prog.createBuffer()!;
        this.glInstanceOffsetBuffer = this.prog.createBuffer()!;
        this.glInstanceColorBuffer = this.prog.createBuffer()!;
    }

    private initBuffersAndUniform() {
        const cellW = 2.0 / SnakeController.width;
        const cellH = 2.0 / SnakeController.height;

        this.vertexBuffer.write2Float32(0, 0);
        this.vertexBuffer.write2Float32(cellW, 0);
        this.vertexBuffer.write2Float32(cellW, -cellH);
        this.vertexBuffer.write2Float32(0, -cellH);

        const gl = this.prog.gl;
        this.prog.useProgram();

        this.prog.arrayBuffer(this.glVertexBuffer, (2 * Float32Array.BYTES_PER_ELEMENT), {
            a_position: {elems: 2, elType: gl.FLOAT, normalized: false, offsetBytes: 0},
        }, this.vertexBuffer.rawBuffer);
        
        this.prog.uniformVector('u_cellSize', cellW, -cellH);

        for (let y = 0; y < SnakeController.height; ++y) {
            for (let x = 0; x < SnakeController.width; ++x) {
                this.instanceOffsetBuffer.write2Uint8(x, y);
            }
        }
        this.prog.arrayBuffer(this.glInstanceOffsetBuffer, (2 * Uint8Array.BYTES_PER_ELEMENT), {
            a_cellIndex: {elems: 2, elType: gl.UNSIGNED_BYTE, normalized: false, offsetBytes: 0},
        }, this.instanceOffsetBuffer.rawBuffer);
        this.prog.markAttributeInstanced('a_cellIndex');
    }

    /**
     * Returns random (x, y) coordinates where apple could be.
     */
    private static randomApple(snake: Snake): [number, number] {
        // We need to generate random cell (which has no snake) in predictable time.
        // So it counts blank cells and returns 'n-th random' blank cell.
        const blankCells = SnakeController.width * SnakeController.height - snake.length;
        let n = Math.round(Math.random() * blankCells);
        for (let y = 0; y < SnakeController.height; ++y) {
            for (let x = 0; x < SnakeController.width; ++x) {
                if (!snake.isSnake(x, y, false)) {
                    if (n === 0) {
                        return [x, y];
                    }
                    --n;
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
        this.speed = 500;
    }

    private updateGameField() {
        const next = SnakeController.nextSnakeHead(this.snake, this.direction);
        if (next[0] === this.apple[0] && next[1] === this.apple[1]) {
            // snake eats an apple
            this.snake.add(next[0], next[1]);
            this.apple = SnakeController.randomApple(this.snake);
            this.speed = Math.max(SnakeController.speed_max, this.speed - SnakeController.speed_delta);
        } else if (this.snake.isSnake(...next, true)) {
            // snake is dead
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
        gl.clearColor(...SnakeController.BACKGROUND, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.prog.useProgram();

        this.instanceColorBuffer.clean();
        for (let y = 0; y < SnakeController.height; ++y) {
            for (let x = 0; x < SnakeController.width; ++x) {
                const isActive = this.snake.isSnake(x, y, false) || (x === this.apple[0] && y === this.apple[1]);
                this.instanceColorBuffer.write1Uint8(isActive ? 1 : 0);
            }
        }

        this.prog.arrayBuffer(this.glInstanceColorBuffer, (Uint8Array.BYTES_PER_ELEMENT), {
            a_active: {elems: 1, elType: gl.UNSIGNED_BYTE, normalized: false, offsetBytes: 0},
        }, this.instanceColorBuffer.rawBuffer);
        this.prog.markAttributeInstanced('a_active');

        const pixelX = 2.0 / this.prog.width;
        const pixelY = 2.0 / this.prog.height;

        // draw borders
        this.prog.uniformVector('u_padding', pixelX * 0.8, pixelY * 0.8);
        this.prog.drawArraysInstanced(gl.LINE_LOOP, 4, SnakeController.width * SnakeController.height);

        // draw filled square
        this.prog.uniformVector('u_padding', pixelX * 2, pixelY * 2);
        this.prog.drawArraysInstanced(gl.TRIANGLE_FAN, 4, SnakeController.width * SnakeController.height);
    }

    public setDirection(d: Direction) {
        const next = SnakeController.nextSnakeHead(this.snake, d);
        if (!this.snake.isSnake(...next, true)) {
            this.direction = d;
        }
    }

    public get visible() {
        return isVisible(this.prog.gl);
    }
}
