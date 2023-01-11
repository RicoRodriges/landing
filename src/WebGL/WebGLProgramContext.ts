import {createProgramFromScripts} from "./WebGLUtil";

export default class WebGLProgramContext {
    readonly gl: WebGLRenderingContext;
    protected instancedExt: ANGLE_instanced_arrays;
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
        this.instancedExt = this.gl.getExtension('ANGLE_instanced_arrays')!;
        if (!this.instancedExt) {
            throw new Error('WebGL ANGLE_instanced_arrays extension is not supported!');
        }
        this.prog = createProgramFromScripts(this.gl, vertexShader, fragmentShader);

        attrs.forEach(n => this.attrs.set(n, this.gl.getAttribLocation(this.prog, n)));
        uniforms.forEach(n => this.uniforms.set(n, this.gl.getUniformLocation(this.prog, n)!));
    }

    public useProgram() {
        this.gl.useProgram(this.prog);
    }

    public uniformMatrix(n: string, v: Float32List) {
        const loc = this.getUniformLoc(n);
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
        const loc = this.getUniformLoc(n);
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

    public textureFromImg(n: string, texture: WebGLTexture, format: GLenum, img: TexImageSource, chanelType: GLenum, unit: number,
        mipmap: true | {generate: boolean, wrapS: GLenum, wrapT: GLenum, minFilter: GLenum}) {
        const loc = this.getUniformLoc(n);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, format, chanelType, img);

        if (mipmap === true || mipmap.generate) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }
        if (mipmap !== true) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, mipmap.wrapS);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, mipmap.wrapT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, mipmap.minFilter);
        }

        this.gl.uniform1i(loc, unit);
    }

    public textureFromBuf(n: string, texture: WebGLTexture, format: GLenum, img: ArrayBufferView, w: number, h: number, chanelType: GLenum, unit: number,
        mipmap: true | {generate: boolean, wrapS: GLenum, wrapT: GLenum, minFilter: GLenum}) {
        const loc = this.getUniformLoc(n);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, w, h, 0, format, chanelType, img);

        if (mipmap === true || mipmap.generate) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }
        if (mipmap !== true) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, mipmap.wrapS);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, mipmap.wrapT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, mipmap.minFilter);
        }

        this.gl.uniform1i(loc, unit);
    }

    public arrayBuffer(buf: WebGLBuffer, bytesPerVertex: GLsizei,
                       attrs: { [attr: string]: { elems: GLint, elType: GLenum, normalized: GLboolean, offsetBytes: GLintptr } },
                       data?: BufferSource, dynamic = false) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        if (data !== undefined) {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, data, dynamic ? this.gl.DYNAMIC_DRAW : this.gl.STATIC_DRAW);
        }
        Object.entries(attrs).forEach(([name, v]) => {
            const loc = this.getAttrLoc(name);
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

    public markAttributeInstanced(attr: string, divisor: number = 1) {
        const loc = this.getAttrLoc(attr);
        this.instancedExt.vertexAttribDivisorANGLE(loc, divisor);
    }

    public drawArraysInstanced(mode: GLenum, vertexes: GLsizei, instances: GLsizei, offset: number = 0) {
        this.instancedExt.drawArraysInstancedANGLE(mode, offset, vertexes, instances);
    }

    public createBuffer() {
        return this.gl.createBuffer();
    }

    public deleteBuffer(buf: WebGLBuffer) {
        this.gl.deleteBuffer(buf);
    }

    public createTexture() {
        return this.gl.createTexture();
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

    private getAttrLoc(attr: string) {
        const loc = this.attrs.get(attr);
        if (loc === undefined) {
            throw new Error(`Program has no ${attr} attribute variables`);
        }
        return loc;
    }

    private getUniformLoc(n: string) {
        const loc = this.uniforms.get(n);
        if (loc === undefined) {
            throw new Error(`Program has no ${n} uniform variables`);
        }
        return loc;
    }
}