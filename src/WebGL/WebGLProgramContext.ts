import {createProgramFromScripts} from "./WebGLUtil";

export default class WebGLProgramContext {
    readonly gl: WebGLRenderingContext;
    protected prog: WebGLProgram;
    protected attrs = new Map<string, number>();
    protected uniforms = new Map<String, WebGLUniformLocation>();

    public constructor(el: HTMLCanvasElement,
                       vertexShader: string,
                       fragmentShader: string,
                       attrs: string[],
                       uniforms: string[]) {
        this.gl = (el.getContext('webgl') || el.getContext('experimental-webgl')) as WebGLRenderingContext;
        if (!this.gl) {
            throw new Error('WebGL is not supported!');
        }
        this.prog = createProgramFromScripts(this.gl, vertexShader, fragmentShader);

        attrs.forEach(n => this.attrs.set(n, this.gl.getAttribLocation(this.prog, n)));
        uniforms.forEach(n => this.uniforms.set(n, this.gl.getUniformLocation(this.prog, n)!));
    }

    public useProgram() {
        this.gl.useProgram(this.prog);
    }

    public uniformMatrix(n: string, v: Float32List) {
        const loc = this.uniforms.get(n);
        if (loc === undefined) {
            throw new Error(`Program has no ${n} uniform variables`);
        }
        const l = v.length;
        if (l === 2 * 2) {
            this.gl.uniformMatrix2fv(loc, false, v);
        } else if (l === 3 * 3) {
            this.gl.uniformMatrix3fv(loc, false, v);
        } else if (l === 4 * 4) {
            this.gl.uniformMatrix4fv(loc, false, v);
        } else {
            throw new Error(`Matrix size ${l} is not supported`);
        }
    }

    public uniformVector(n: string, v1: GLfloat, v2?: GLfloat, v3?: GLfloat, v4?: GLfloat) {
        const loc = this.uniforms.get(n);
        if (loc === undefined) {
            throw new Error(`Program has no ${n} uniform variables`);
        }

        if (v4 !== undefined) {
            this.gl.uniform4f(loc, v1, v2!, v3!, v4);
        } else if (v3 !== undefined) {
            this.gl.uniform3f(loc, v1, v2!, v3);
        } else if (v2 !== undefined) {
            this.gl.uniform2f(loc, v1, v2);
        } else {
            this.gl.uniform1f(loc, v1);
        }
    }

    public arrayBuffer(buf: WebGLBuffer, bytesPerVertex: GLsizei,
                       attrs: { [attr: string]: { elems: GLint, elType: GLenum, normalized: GLboolean, offsetBytes: GLintptr } },
                       data?: BufferSource, dynamic = false) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        if (data !== undefined) {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, data, dynamic ? this.gl.DYNAMIC_DRAW : this.gl.STATIC_DRAW);
        }
        Object.entries(attrs).forEach(([name, v]) => {
            const loc = this.attrs.get(name);
            if (loc === undefined) {
                throw new Error(`Program has no ${name} attribute variables`);
            }

            this.gl.enableVertexAttribArray(loc);
            this.gl.vertexAttribPointer(loc, v.elems, v.elType, v.normalized, bytesPerVertex, v.offsetBytes);
        });
    }

    public indexBuffer(buf: WebGLBuffer, data?: BufferSource, dynamic = false) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buf);
        if (data !== undefined) {
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, dynamic ? this.gl.DYNAMIC_DRAW : this.gl.STATIC_DRAW);
        }
    }

    public drawElements(mode: GLenum, indexes: GLsizei, indexType: GLenum, offset: number = 0) {
        this.gl.drawElements(mode, indexes, indexType, offset);
    }

    public drawArrays(mode: GLenum, vertexes: GLsizei, offset: number = 0) {
        this.gl.drawArrays(mode, offset, vertexes);
    }

    public createBuffer() {
        return this.gl.createBuffer();
    }

    public deleteBuffer(buf: WebGLBuffer) {
        this.gl.deleteBuffer(buf);
    }

    public destroyProgram() {
        this.gl.deleteProgram(this.prog);
    }

    public get width() {
        return this.gl.canvas.clientWidth;
    }

    public get height() {
        return this.gl.canvas.clientHeight;
    }
}