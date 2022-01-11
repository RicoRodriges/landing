import Particle from "./Particle";
import Mask from "./Mask";
import {resizeContext} from "../WebGL/WebGLUtil";
import WebGLProgramContext from "../WebGL/WebGLProgramContext";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import IndexBuffer from "../WebGL/wrappers/IndexBuffer";

export default class ParticleController {
    el: HTMLCanvasElement;
    lineProg!: WebGLProgramContext;
    pointProg!: WebGLProgramContext;

    vertexBuffer = new DataBuffer(1); // particle coords, Uint16
    indexBuffer = new IndexBuffer(1);

    glVertexBuffer!: WebGLBuffer;
    glIndexBuffer!: WebGLBuffer;

    particles: Particle[] = [];
    springConst = .000025;

    mask: Mask | undefined;

    paused = false;

    constructor(el: HTMLCanvasElement, particles: number, mask: Mask | undefined = undefined) {
        this.el = el;
        this.mask = mask;

        const w = this.el.clientWidth;
        const h = this.el.clientHeight;
        for (let i = 0; i < particles; ++i)
            this.particles.push(new Particle(w, h));

        this.initGLContext();
        this.drawNextFrame();
    }

    private initGLContext() {
        const lineVertexShaderCode = `
            attribute vec2 a_position;
            
            uniform vec2 u_resolution;

            void main() {
              // [0; +oo] -> [0; 1] -> [0; 2] -> [-1; 1]
              vec2 clipSpace = a_position / u_resolution * 2.0 - 1.0;
              gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `;
        const lineFragmentShaderCode = `
            precision mediump float;
            void main() {
              gl_FragColor = vec4(0.75, 0.75, 0.75, 1); // #CCC
            }
        `;
        this.lineProg = new WebGLProgramContext(this.el, lineVertexShaderCode, lineFragmentShaderCode,
            ['a_position'],
            ['u_resolution']);

        const pointVertexShaderCode = `
            attribute vec2 a_position;
            
            uniform vec2 u_resolution;
            
            varying vec2 v_pos;

            void main() {
              // [0; +oo] -> [0; 1] -> [0; 2] -> [-1; 1]
              vec2 clipSpace = a_position / u_resolution * 2.0 - 1.0;
              gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
              
              gl_PointSize = 7.0;

              v_pos = gl_Position.xy;
            }
        `;
        const pointFragmentShaderCode = `
            precision mediump float;
            
            varying vec2 v_pos;

            void main() {
              if (abs(distance(v_pos, gl_FragCoord.xy)) < 10.0) {
                discard;
              }
              
              // [-1; 1] -> [0; 1] 
              gl_FragColor = vec4(v_pos * 0.5 + 0.5, 0.5, 1);
            }
        `;
        this.pointProg = new WebGLProgramContext(this.el, pointVertexShaderCode, pointFragmentShaderCode,
            ['a_position'],
            ['u_resolution']);

        this.glVertexBuffer = this.pointProg.createBuffer()!;
        this.glIndexBuffer = this.pointProg.createBuffer()!;
    }

    private drawNextFrame() {
        if (this.paused) return;

        window.requestAnimationFrame(this.drawNextFrame.bind(this));

        const gl = this.lineProg.gl;
        resizeContext(gl);
        const w = this.lineProg.width;
        const h = this.lineProg.height;

        this.mask?.updateScale(w, h);

        const vertexBufferSize = this.particles.length * 2 * Uint16Array.BYTES_PER_ELEMENT;
        this.vertexBuffer.reserveAndClean(vertexBufferSize);
        const indexBufferSize = this.particles.length * this.particles.length * 2 * Uint16Array.BYTES_PER_ELEMENT;
        this.indexBuffer.reserveAndClean(indexBufferSize);

        this.particles.forEach((p) => {
            p.update(w, h);
            this.vertexBuffer.write2Uint16(p.x, p.y);
        });

        const minSquareDist = w * 10;
        for (let i = 0; i < this.particles.length; ++i) {
            const p1 = this.particles[i];

            if (this.mask && !this.mask.isIntersect(p1.x, p1.y)) {
                continue;
            }

            for (let j = i + 1; j < this.particles.length; ++j) {
                const p2 = this.particles[j];

                if (this.mask && !this.mask.isIntersect(p2.x, p2.y)) {
                    continue;
                }

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dSquare = dx * dx + dy * dy;

                if (dSquare < minSquareDist) {

                    if (this.mask && !this.mask.isConnected(p1.x, p1.y, p2.x, p2.y)) {
                        continue;
                    }

                    p1.vx -= dx * this.springConst;
                    p1.vy -= dy * this.springConst;
                    p2.vx += dx * this.springConst;
                    p2.vy += dy * this.springConst;

                    const lineWidth = (1 - dSquare / minSquareDist) * 2;
                    this.indexBuffer.write2Uint16(i, j);
                    // lines.push(new Line(p1.x, p1.y, p2.x, p2.y, lineWidth));
                }
            }
        }

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.lineProg.useProgram();
        this.lineProg.arrayBuffer(this.glVertexBuffer, Uint16Array.BYTES_PER_ELEMENT * 2, {
            a_position: {elems: 2, elType: gl.UNSIGNED_SHORT, normalized: false, offsetBytes: 0},
        }, this.vertexBuffer.sliceUint16());
        this.lineProg.indexBuffer(this.glIndexBuffer, this.indexBuffer.sliceUint16());
        this.lineProg.uniformVector('u_resolution', w, h);
        this.lineProg.drawElements(gl.LINES, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);


        this.indexBuffer.clean();
        for (let i = 0; i < this.particles.length; ++i) {
            this.indexBuffer.write1Uint16(i);
        }

        this.pointProg.useProgram();
        this.pointProg.arrayBuffer(this.glVertexBuffer, Uint16Array.BYTES_PER_ELEMENT * 2, {
            a_position: {elems: 2, elType: gl.UNSIGNED_SHORT, normalized: false, offsetBytes: 0},
        });
        this.pointProg.indexBuffer(this.glIndexBuffer, this.indexBuffer.sliceUint16());
        this.pointProg.uniformVector('u_resolution', w, h);
        this.pointProg.drawElements(gl.POINTS, this.indexBuffer.bytes / 2, gl.UNSIGNED_SHORT);
    }

    public set active(v: boolean) {
        this.paused = !v;
        if (!this.paused) {
            this.drawNextFrame();
        }
    }
}
