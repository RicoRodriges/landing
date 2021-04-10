export default abstract class TriangleDrawable {
    getStaticTriangleCount() {
        return 0;
    }
    writeStaticTriangles(buf: Float32Array, offset: number) {}
    writeStaticColors(buf: Uint8ClampedArray, offset: number) {}

    getDynamicTriangleCount() {
        return 0;
    };
    writeDynamicTriangles(buf: Float32Array, offset: number) {}
    writeDynamicColors(buf: Uint8ClampedArray, offset: number) {}
}
