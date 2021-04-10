import {createProgram, createShader, resizeContext} from "../WebGL/WebGLUtil";
import {Color, House, Roof, TownObject} from "./town-objects";
import FloatArrayWrapper from "../WebGL/wrappers/FloatArrayWrapper";
import Matrix4 from "../WebGL/Matrix4";
import ByteArrayWrapper from "../WebGL/wrappers/ByteArrayWrapper";
import WebGLDrawer from "../WebGL/WebGLDrawer";

export default class TownController {
    el: HTMLCanvasElement;
    ctx: WebGLRenderingContext;

    houseProgram: WebGLProgram;

    bgColor: Color;

    grid: TownObject[][][] = [];

    staticDrawer: WebGLDrawer<TownObject>;

    gridWidth = 5;
    gridHeight = 5;
    gridSize = 100;

    constructor(canvas: HTMLCanvasElement, bgColor: Color) {
        this.el = canvas;
        this.ctx = this.el.getContext('experimental-webgl') as WebGLRenderingContext;
        if (!this.ctx) {
            throw new Error('WebGL is not supported!');
        }
        this.bgColor = bgColor;

        const vertexShaderCode =
            'attribute vec4 a_position;' +
            'attribute vec4 a_color;' +

            'uniform mat4 u_matrix;' +

            'varying vec4 v_color;' +

            'void main() {' +
            '  gl_Position = u_matrix * a_position;' +
            '  v_color = a_color;' +
            '}';
        const vertexShader = createShader(this.ctx, this.ctx.VERTEX_SHADER, vertexShaderCode);

        const fragmentShaderCode =
            'precision mediump float;' +

            'varying vec4 v_color;' +

            'void main() {' +
            '   gl_FragColor = v_color;' +
            '}';
        const fragmentShader = createShader(this.ctx, this.ctx.FRAGMENT_SHADER, fragmentShaderCode);

        this.houseProgram = createProgram(this.ctx, vertexShader, fragmentShader);

        this.grid = [];
        for (let x = 0; x < this.gridWidth; ++x) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridHeight; ++y) {
                this.grid[x][y] = [];
            }
        }
        this.grid[1][1].push(new House(40, 90, 40, new Color(50, 50, 50, 255), 50, 50));
        this.grid[1][1].push(new Roof(this.grid[1][1][0] as House, new Color(75+100, 75 + 100, 75 + 100, 255), true, true));
        this.grid[1][2].push(new House(30, 60, 30, new Color(75, 75, 75, 255), 50, 50));
        this.grid[1][2].push(new Roof(this.grid[1][2][0] as House, new Color(75+100, 75 + 100, 75 + 100, 255), true, true));

        const plainGrid: TownObject[] = [];
        this.grid.forEach((gridY, x) =>
            gridY.forEach((objs, y) =>
                objs.forEach((o) => {
                    o.setOffsetX(this.gridSize * x);
                    o.setOffsetY(this.gridSize * y);
                    plainGrid.push(o);
                })
            )
        );

        this.staticDrawer = new WebGLDrawer<TownObject>(this.ctx, this.houseProgram, true, 3, (o) => o.getTriangleCount(),
            'a_position', (o,b,off) => o.writeTriangles(b, off),
            'a_color', (o,b,off) => o.writeColors(b, off));
        this.staticDrawer.beforeDrawCall = (gl, prog) => {
            // TODO: hardcoded value!!!
            const matrix = new Matrix4(this.el.clientWidth, this.el.clientHeight, 1000);
            matrix.xRotate(Math.PI / 1.5);
            matrix.yRotate(0); // 45 deg
            matrix.zRotate(- Math.PI/ 1.3);
            matrix.translate(0,300,-100);
            matrix.scale(1, 1, 1);

            const matrixGLAttribute = gl.getUniformLocation(prog, "u_matrix");
            gl.uniformMatrix4fv(matrixGLAttribute, false, matrix.data);
        };
        this.staticDrawer.objects = plainGrid;

        this.anim();
    }

    private anim() {
        //window.requestAnimationFrame(this.anim.bind(this));

        resizeContext(this.ctx);
        // const w = this.ctx.canvas.width;
        // const h = this.ctx.canvas.height;

        this.ctx.clearColor(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);

        this.ctx.enable(this.ctx.CULL_FACE);
        this.ctx.cullFace(this.ctx.FRONT);
        this.ctx.enable(this.ctx.DEPTH_TEST);

        this.staticDrawer.draw();
    }
}
