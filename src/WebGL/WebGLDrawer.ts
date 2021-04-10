export default class WebGLDrawer<T> {
    private readonly ctx: WebGLRenderingContext;
    private readonly prog: WebGLProgram;
    private _objects: T[] = [];
    private readonly positionAttribute: string;
    private readonly colorAttribute: string | null;
    private readonly dimensions: number;
    private readonly isStatic: boolean;

    private readonly getTriangleCount: ((e: T) => number);
    private readonly writeTriangles: (e: T, buf: Float32Array, offset: number) => void;
    private readonly writeColors: ((e: T, buf: Uint8ClampedArray, offset: number) => void) | null;

    private isFirstDraw = true;
    private triangles = 0;
    private triangleBuffer: Float32Array | null = null;
    private colorBuffer: Uint8ClampedArray | null = null;

    private readonly positionGLBuffer: WebGLBuffer | null;
    private readonly colorGLBuffer: WebGLBuffer | null;

    private _beforeDrawCall: ((gl: WebGLRenderingContext, prog: WebGLProgram) => void) | null = null;

    constructor(ctx: WebGLRenderingContext,
                prog: WebGLProgram,
                isStatic: boolean,
                dimensions = 3,
                getTriangleCount: ((e: T) => number),
                positionAttribute: string,
                writeTriangles: (e: T, buf: Float32Array, offset: number) => void,
                colorAttribute: string | null = null,
                writeColors: ((e: T, buf: Uint8ClampedArray, offset: number) => void) | null = null) {
        this.ctx = ctx;
        this.prog = prog;
        this.isStatic = isStatic;
        this.positionAttribute = positionAttribute;
        this.colorAttribute = colorAttribute;
        this.dimensions = dimensions;

        this.getTriangleCount = getTriangleCount;
        this.writeTriangles = writeTriangles;
        this.writeColors = writeColors;

        this.positionGLBuffer = this.ctx.createBuffer();
        this.colorGLBuffer = colorAttribute ? this.ctx.createBuffer() : null;
    }

    set objects(value: T[]) {
        this._objects = value;
        this.isFirstDraw = true;
    }

    set beforeDrawCall(value: ((gl: WebGLRenderingContext, prog: WebGLProgram) => void) | null) {
        this._beforeDrawCall = value;
    }

    draw() {
        if (this.isFirstDraw || !this.isStatic) {
            this.fillBuffer();
        }
        this.isFirstDraw = false;

        if (this.triangles > 0 && this.triangleBuffer) {
            this.drawTriangles(this.triangles, this.triangleBuffer, this.colorBuffer);
        }
    }

    private drawTriangles(triangles: number, triangleBuffer: Float32Array, colorBuffer: Uint8ClampedArray | null) {

        if (triangles > 0) {
            const posGLAttribute = this.ctx.getAttribLocation(this.prog, this.positionAttribute);
            const colorGLAttribute = this.colorAttribute ? this.ctx.getAttribLocation(this.prog, this.colorAttribute) : null;

            {
                this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionGLBuffer);
                this.ctx.bufferData(this.ctx.ARRAY_BUFFER, triangleBuffer, this.ctx.STATIC_DRAW);
                this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null);
            }

            if (this.colorGLBuffer) {
                this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.colorGLBuffer);
                this.ctx.bufferData(this.ctx.ARRAY_BUFFER, colorBuffer, this.ctx.STATIC_DRAW);
                this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null);
            }

            this.ctx.useProgram(this.prog);

            {
                this.ctx.enableVertexAttribArray(posGLAttribute);
                this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionGLBuffer);

                const size = this.dimensions;
                const type = this.ctx.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                this.ctx.vertexAttribPointer(posGLAttribute, size, type, normalize, stride, offset);
            }

            if (colorGLAttribute) {
                this.ctx.enableVertexAttribArray(colorGLAttribute);
                this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.colorGLBuffer);

                const size = 4;
                const type = this.ctx.UNSIGNED_BYTE;
                const normalize = true;
                const stride = 0;
                const offset = 0;
                this.ctx.vertexAttribPointer(colorGLAttribute, size, type, normalize, stride, offset);
            }

            if (this._beforeDrawCall) {
                this._beforeDrawCall(this.ctx, this.prog);
            }

            {
                const primitiveType = this.ctx.TRIANGLES;
                const offset = 0;
                const count = triangles * 3;
                this.ctx.drawArrays(primitiveType, offset, count);
            }
        }
    }

    private fillBuffer() {
        this.triangles = 0;
        this._objects.forEach((o) => {
            this.triangles += this.getTriangleCount(o);
        });

        if (this.triangles > 0) {
            const floatBufferSize = this.triangles * 3 * this.dimensions;
            if (!this.triangleBuffer || this.triangleBuffer.byteLength < floatBufferSize * this.triangleBuffer.BYTES_PER_ELEMENT) {
                this.triangleBuffer = new Float32Array(floatBufferSize);
            }

            const colorBufferSize = this.triangles * 3 * 4;
            if (this.writeColors && (!this.colorBuffer || this.colorBuffer.byteLength < colorBufferSize * this.colorBuffer.BYTES_PER_ELEMENT)) {
                this.colorBuffer = new Uint8ClampedArray(colorBufferSize);
            }

            let offset = 0;
            this._objects.forEach((o) => {
                this.writeTriangles(o, this.triangleBuffer as Float32Array, offset * 3 * this.dimensions);
                if (this.writeColors && this.colorBuffer) {
                    this.writeColors(o, this.colorBuffer, offset * 3 * 4);
                }
                offset += this.getTriangleCount(o);
            });
        }
    }
}
