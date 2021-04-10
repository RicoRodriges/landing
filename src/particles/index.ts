import Particle from "./Particle";
import Mask from "./Mask";
import {createProgram, createShader, resizeContext} from "../WebGL/WebGLUtil";
import {Line, Point} from "./graphic-types";
import WebGLDrawer from "../WebGL/WebGLDrawer";

export default class ParticleController {
    el: HTMLCanvasElement;
    ctx: WebGLRenderingContext;

    particles: Particle[] = [];
    springConst = .000025;

    mask: Mask | undefined;

    lineProgram: WebGLProgram;
    pointProgram: WebGLProgram;

    lineDrawer: WebGLDrawer<Line>;
    pointDrawer: WebGLDrawer<Point>;

    started = true;

    constructor(canvas: string, particles: number, mask: Mask | undefined = undefined) {
        this.el = document.getElementById(canvas) as HTMLCanvasElement;
        if (!this.el) {
            throw new Error(`HTML element '${canvas}' does not exist!`);
        }
        this.ctx = this.el.getContext('experimental-webgl') as WebGLRenderingContext;
        if (!this.ctx) {
            throw new Error('WebGL is not supported!');
        }
        this.mask = mask;

        const w = this.el.width;
        const h = this.el.height;
        for (let i = 0; i < particles; ++i)
            this.particles.push(new Particle(w, h));

        const vertexShaderCode =
            'attribute vec2 a_position;' +
            'uniform vec2 u_resolution;' +
            'varying vec4 v_color;' +

            'void main() {' +
            '  vec2 zeroToOne = a_position / u_resolution;' + // [0; +oo] -> [0; 1]
            '  vec2 zeroToTwo = zeroToOne * 2.0;' + // [0; 1] -> [0; 2]
            '  vec2 clipSpace = zeroToTwo - 1.0;' + // [0; 2] -> [-1; 1]
            '  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);' +

            '  v_color = gl_Position * 0.5 + 0.5;' + // [-1; 1] -> [0; 1]
            '}';
        const vertexShader = createShader(this.ctx, this.ctx.VERTEX_SHADER, vertexShaderCode);

        const lineFragmentShaderCode =
            'precision mediump float;' +
            'varying vec4 v_color;' +

            'void main() {' +
            '  gl_FragColor = vec4(0.75, 0.75, 0.75, 1);' + // #CCC
            '}';
        const lineFragmentShader = createShader(this.ctx, this.ctx.FRAGMENT_SHADER, lineFragmentShaderCode);

        const pointFragmentShaderCode =
            'precision mediump float;' +
            'varying vec4 v_color;' +

            'void main() {' +
            '  gl_FragColor = v_color;' +
            '}';
        const pointFragmentShader = createShader(this.ctx, this.ctx.FRAGMENT_SHADER, pointFragmentShaderCode);

        this.lineProgram = createProgram(this.ctx, vertexShader, lineFragmentShader);
        this.pointProgram = createProgram(this.ctx, vertexShader, pointFragmentShader);

        this.lineDrawer = new WebGLDrawer<Line>(this.ctx, this.lineProgram, false, 2, (l) => l.getTriangleCount(), 'a_position', (l, b, o) => l.writeTriangles(b, o));
        this.pointDrawer = new WebGLDrawer<Point>(this.ctx, this.pointProgram, false, 2, (p) => p.getTriangleCount(), 'a_position', (p, b, o) => p.writeTriangles(b, o));

        const setResolution = (ctx: WebGLRenderingContext, prog: WebGLProgram) => {
            const resolutionGLAttribute = ctx.getUniformLocation(prog, "u_resolution");
            this.ctx.uniform2f(resolutionGLAttribute, ctx.canvas.width, ctx.canvas.height);
        };
        this.lineDrawer.beforeDrawCall = setResolution;
        this.pointDrawer.beforeDrawCall = setResolution;

        this.anim();
    }

    private anim() {
        if (this.started) {
            window.requestAnimationFrame(this.anim.bind(this));

            resizeContext(this.ctx);
            const w = this.ctx.canvas.width;
            const h = this.ctx.canvas.height;

            const minSquareDist = w * 20;

            // const lineMapper = (l: Line, buf: Float32Array) => {
            //     // Triangle 1
            //     buf[0] = l.x1 - l.width / 2;
            //     buf[1] = l.y1 - l.width / 2;
            //     buf[2] = l.x2 - l.width / 2;
            //     buf[3] = l.y2 - l.width / 2;
            //     buf[4] = l.x2 + l.width / 2;
            //     buf[5] = l.y2 + l.width / 2;
            //
            //     // Triangle 2
            //     buf[6] = l.x1 + l.width / 2;
            //     buf[7] = l.y1 + l.width / 2;
            //     buf[8] = l.x1 - l.width / 2;
            //     buf[9] = l.y1 - l.width / 2;
            //     buf[10] = l.x2 + l.width / 2;
            //     buf[11] = l.y2 + l.width / 2;
            // };
            // const lines = new FloatArrayWrapper(12, lineMapper);
            //
            // const pointMapper = (p: Point, buf: Float32Array) => {
            //     // Triangle 1
            //     buf[0] = p.x - p.width / 2;
            //     buf[1] = p.y;
            //     buf[2] = p.x;
            //     buf[3] = p.y - p.width / 2;
            //     buf[4] = p.x;
            //     buf[5] = p.y + p.width / 2;
            //
            //     // Triangle 2
            //     buf[6] = p.x + p.width / 2;
            //     buf[7] = p.y;
            //     buf[8] = p.x;
            //     buf[9] = p.y - p.width / 2;
            //     buf[10] = p.x;
            //     buf[11] = p.y + p.width / 2;
            // };
            // const points = new FloatArrayWrapper(12, pointMapper);
            const lines: Line[] = [];

            this.particles.forEach((p) => {
                p.update(w, h);
            });

            for (let i = 0; i < this.particles.length; ++i) {
                const p1 = this.particles[i];

                if (this.mask && !this.mask.isIntersect(p1.x, p1.y, w, h)) {
                    continue;
                }

                for (let j = i + 1; j < this.particles.length; ++j) {
                    const p2 = this.particles[j];

                    if (this.mask && !this.mask.isIntersect(p2.x, p2.y, w, h)) {
                        continue;
                    }

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dSquare = dx * dx + dy * dy;

                    if (dSquare < minSquareDist) {

                        if (this.mask && !this.mask.isConnected(p1.x, p1.y, p2.x, p2.y, w, h)) {
                            continue;
                        }

                        p1.vx -= dx * this.springConst;
                        p1.vy -= dy * this.springConst;
                        p2.vx += dx * this.springConst;
                        p2.vy += dy * this.springConst;

                        const lineWidth = (1 - dSquare / minSquareDist) * 2;
                        lines.push(new Line(p1.x, p1.y, p2.x, p2.y, lineWidth));
                    }
                }
            }

            this.ctx.clearColor(0, 0, 0, 1);
            this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);

            this.lineDrawer.objects = lines;
            this.lineDrawer.draw();

            this.pointDrawer.objects = this.particles;
            this.pointDrawer.draw();
            // this.drawLines(lines);
            // this.drawPoints(points);
        }
    }

    // private drawLines(lines: FloatArrayWrapper<Line>) {
    //     this.drawTriangles(lines, this.lineProgram);
    // }
    //
    // private drawPoints(points: FloatArrayWrapper<Point>) {
    //     this.drawTriangles(points, this.pointProgram);
    // }
    //
    // private drawTriangles(wrapper: FloatArrayWrapper<any>, program: WebGLProgram) {
    //     const posGLAttribute = this.ctx.getAttribLocation(program, "a_position");
    //     const resolutionGLAttribute = this.ctx.getUniformLocation(program, "u_resolution");
    //
    //     const glBuffer = this.ctx.createBuffer();
    //
    //     {
    //         this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, glBuffer);
    //         this.ctx.bufferData(this.ctx.ARRAY_BUFFER, wrapper.toBuffer(), this.ctx.STATIC_DRAW);
    //         this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null);
    //     }
    //
    //     this.ctx.useProgram(program);
    //
    //     {
    //         this.ctx.enableVertexAttribArray(posGLAttribute);
    //         this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, glBuffer);
    //         const size = 2; // 2 floats - x and y
    //         const type = this.ctx.FLOAT; // 32 bit
    //         const normalize = false;
    //         const stride = 0; // size * sizeof(float)
    //         const offset = 0;
    //         this.ctx.vertexAttribPointer(posGLAttribute, size, type, normalize, stride, offset);
    //     }
    //
    //     this.ctx.uniform2f(resolutionGLAttribute, this.ctx.canvas.width, this.ctx.canvas.height);
    //
    //     {
    //         const primitiveType = this.ctx.TRIANGLES;
    //         const offset = 0;
    //         const count = wrapper.getLength() * 3 * 2; // Each line is 2 triangles. Triangle is 3 points.
    //         this.ctx.drawArrays(primitiveType, offset, count);
    //     }
    // }
}
