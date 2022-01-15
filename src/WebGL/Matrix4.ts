export default class Matrix4 {

    readonly data: Float32Array;

    public constructor(v?: ArrayLike<number>) {
        v = v || [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
        if (v.length !== 4 * 4) throw new Error("Matrix is 4x4");
        this.data = new Float32Array(v);
    }

    multiply(b: Matrix4) {
        const a00 = this.data[0 * 4 + 0];
        const a01 = this.data[0 * 4 + 1];
        const a02 = this.data[0 * 4 + 2];
        const a03 = this.data[0 * 4 + 3];
        const a10 = this.data[1 * 4 + 0];
        const a11 = this.data[1 * 4 + 1];
        const a12 = this.data[1 * 4 + 2];
        const a13 = this.data[1 * 4 + 3];
        const a20 = this.data[2 * 4 + 0];
        const a21 = this.data[2 * 4 + 1];
        const a22 = this.data[2 * 4 + 2];
        const a23 = this.data[2 * 4 + 3];
        const a30 = this.data[3 * 4 + 0];
        const a31 = this.data[3 * 4 + 1];
        const a32 = this.data[3 * 4 + 2];
        const a33 = this.data[3 * 4 + 3];
        const b00 = b.data[0 * 4 + 0];
        const b01 = b.data[0 * 4 + 1];
        const b02 = b.data[0 * 4 + 2];
        const b03 = b.data[0 * 4 + 3];
        const b10 = b.data[1 * 4 + 0];
        const b11 = b.data[1 * 4 + 1];
        const b12 = b.data[1 * 4 + 2];
        const b13 = b.data[1 * 4 + 3];
        const b20 = b.data[2 * 4 + 0];
        const b21 = b.data[2 * 4 + 1];
        const b22 = b.data[2 * 4 + 2];
        const b23 = b.data[2 * 4 + 3];
        const b30 = b.data[3 * 4 + 0];
        const b31 = b.data[3 * 4 + 1];
        const b32 = b.data[3 * 4 + 2];
        const b33 = b.data[3 * 4 + 3];
        this.data[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        this.data[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        this.data[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        this.data[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        this.data[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        this.data[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        this.data[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        this.data[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        this.data[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        this.data[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        this.data[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        this.data[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        this.data[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        this.data[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        this.data[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        this.data[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    }

    public static Ortho(left: number, right: number,
                        bottom: number, top: number,
                        near: number, far: number) {
        return new Matrix4([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, 2 / (near - far), 0,

            (left + right) / (left - right),
            (bottom + top) / (bottom - top),
            (near + far) / (near - far),
            1,
        ]);
    }

    public static Perspective(fieldOfViewInRadians: number, aspect: number,
                              near: number, far: number) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        const rangeInv = 1.0 / (near - far);

        return new Matrix4([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0,
        ]);
    }

    public static Translate(tx: number, ty: number, tz: number) {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ]);
    }

    public static XRotate(rad: number) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        return new Matrix4([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ]);
    }

    public static YRotate(rad: number) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        return new Matrix4([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ]);
    }

    public static ZRotate(rad: number) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        return new Matrix4([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    public static Scale(sx: number, sy: number, sz: number) {
        return new Matrix4([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ]);
    }

    public static LookAt(eyeX: number, eyeY: number, eyeZ: number,
                         centerX: number, centerY: number, centerZ: number,
                         upX: number, upY: number, upZ: number) {
        let fx = centerX - eyeX;
        let fy = centerY - eyeY;
        let fz = centerZ - eyeZ;

        const rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx *= rlf;
        fy *= rlf;
        fz *= rlf;

        let sx = fy * upZ - fz * upY;
        let sy = fz * upX - fx * upZ;
        let sz = fx * upY - fy * upX;

        const rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx *= rls;
        sy *= rls;
        sz *= rls;

        const ux = sy * fz - sz * fy;
        const uy = sz * fx - sx * fz;
        const uz = sx * fy - sy * fx;

        return new Matrix4([
            sx, ux, -fx, 0,
            sy, uy, -fy, 0,
            sz, uz, -fz, 0,
            0, 0, 0, 1,
        ]).translate(-eyeX, -eyeY, -eyeZ);
    };

    // public static LookAt(eyeX: number, eyeY: number, eyeZ: number,
    //                      targetX: number, targetY: number, targetZ: number,
    //                      upX: number, upY: number, upZ: number) {
    //     var zAxis = normalize(
    //         subtractVectors(cameraPosition, target));
    //     var xAxis = normalize(cross(up, zAxis));
    //     var yAxis = normalize(cross(zAxis, xAxis));
    //
    //     return [
    //         xAxis[0], xAxis[1], xAxis[2], 0,
    //         yAxis[0], yAxis[1], yAxis[2], 0,
    //         zAxis[0], zAxis[1], zAxis[2], 0,
    //         eyeX, eyeY, eyeZ, 1,
    //     ];
    // }
    //
    // public inverse() {
    //     const m = this.data;
    //     const m00 = m[0 * 4 + 0];
    //     const m01 = m[0 * 4 + 1];
    //     const m02 = m[0 * 4 + 2];
    //     const m03 = m[0 * 4 + 3];
    //     const m10 = m[1 * 4 + 0];
    //     const m11 = m[1 * 4 + 1];
    //     const m12 = m[1 * 4 + 2];
    //     const m13 = m[1 * 4 + 3];
    //     const m20 = m[2 * 4 + 0];
    //     const m21 = m[2 * 4 + 1];
    //     const m22 = m[2 * 4 + 2];
    //     const m23 = m[2 * 4 + 3];
    //     const m30 = m[3 * 4 + 0];
    //     const m31 = m[3 * 4 + 1];
    //     const m32 = m[3 * 4 + 2];
    //     const m33 = m[3 * 4 + 3];
    //     const tmp_0  = m22 * m33;
    //     const tmp_1  = m32 * m23;
    //     const tmp_2  = m12 * m33;
    //     const tmp_3  = m32 * m13;
    //     const tmp_4  = m12 * m23;
    //     const tmp_5  = m22 * m13;
    //     const tmp_6  = m02 * m33;
    //     const tmp_7  = m32 * m03;
    //     const tmp_8  = m02 * m23;
    //     const tmp_9  = m22 * m03;
    //     const tmp_10 = m02 * m13;
    //     const tmp_11 = m12 * m03;
    //     const tmp_12 = m20 * m31;
    //     const tmp_13 = m30 * m21;
    //     const tmp_14 = m10 * m31;
    //     const tmp_15 = m30 * m11;
    //     const tmp_16 = m10 * m21;
    //     const tmp_17 = m20 * m11;
    //     const tmp_18 = m00 * m31;
    //     const tmp_19 = m30 * m01;
    //     const tmp_20 = m00 * m21;
    //     const tmp_21 = m20 * m01;
    //     const tmp_22 = m00 * m11;
    //     const tmp_23 = m10 * m01;
    //
    //     const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
    //         (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    //     const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
    //         (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    //     const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
    //         (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    //     const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
    //         (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    //
    //     var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    //
    //     dst[0] = d * t0;
    //     dst[1] = d * t1;
    //     dst[2] = d * t2;
    //     dst[3] = d * t3;
    //     dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
    //         (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    //     dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
    //         (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    //     dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
    //         (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    //     dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
    //         (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    //     dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
    //         (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    //     dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
    //         (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    //     dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
    //         (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    //     dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
    //         (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    //     dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
    //         (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    //     dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
    //         (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    //     dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
    //         (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    //     dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
    //         (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
    //
    //     return dst;
    // }


    translate(tx: number, ty: number, tz: number) {
        this.multiply(Matrix4.Translate(tx, ty, tz));
        return this;
    }

    xRotate(rad: number) {
        this.multiply(Matrix4.XRotate(rad));
        return this;
    }

    yRotate(rad: number) {
        this.multiply(Matrix4.YRotate(rad));
        return this;
    }

    zRotate(rad: number) {
        this.multiply(Matrix4.ZRotate(rad));
        return this;
    }

    scale(sx: number, sy: number, sz: number) {
        this.multiply(Matrix4.Scale(sx, sy, sz));
        return this;
    }

    lookAt(eyeX: number, eyeY: number, eyeZ: number,
           centerX: number, centerY: number, centerZ: number,
           upX: number, upY: number, upZ: number) {
        this.multiply(Matrix4.LookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
        return this;
    };
}
