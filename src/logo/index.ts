import {isVisible, resizeContext} from "../WebGL/WebGLUtil";
import WebGLProgramContext from "../WebGL/WebGLProgramContext";
import DataBuffer from "../WebGL/wrappers/DataBuffer";
import Logo from "./Logo";

export default class LogoController {
    private static readonly COLORS = new Float32Array([
        0xbe / 255, 0x00 / 255, 0xff / 255,
        0x00 / 255, 0xfe / 255, 0xff / 255,
        0xff / 255, 0x83 / 255, 0x00 / 255,
        0x00 / 255, 0x26 / 255, 0xff / 255,
        0xff / 255, 0xfa / 255, 0x01 / 255,
        0xff / 255, 0x26 / 255, 0x00 / 255,
        0xff / 255, 0x00 / 255, 0x8b / 255,
        0x25 / 255, 0xff / 255, 0x01 / 255,
    ]);

    private el: HTMLCanvasElement;
    private prog!: WebGLProgramContext;

    private vertexCoordBuffer = new DataBuffer(Uint16Array.BYTES_PER_ELEMENT * 2 * 4); // 4 corners, corner = 2 coordinates
    private vertexTextureBuffer = new DataBuffer(Uint8Array.BYTES_PER_ELEMENT * 2 * 4); // 4 corners, corner = 2 coordinates

    private glVertexCoordBuffer!: WebGLBuffer;
    private glVertexTextureBuffer!: WebGLBuffer;
    private glTexture!: WebGLTexture;

    private logo: Logo | null = null;

    constructor(el: HTMLCanvasElement, logoUrl: string) {
        this.el = el;

        this.initGLContext(logoUrl);
        this.drawNextFrame();
    }

    private initGLContext(logoUrl: string) {
        const vertexShaderCode = `
            attribute vec2 a_position;
            attribute vec2 a_texcoord;

            uniform vec2 u_resolution;

            varying vec2 v_texcoord;

            void main() {
              // [0; +oo] -> [0; 1] -> [0; 2] -> [-1; 1]
              vec2 clipSpace = a_position / u_resolution * 2.0 - 1.0;
              gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            
              v_texcoord = a_texcoord;
            }
        `;
        const fragmentShaderCode = `
            precision mediump float;

            varying vec2 v_texcoord;

            uniform sampler2D u_texture;
            uniform vec3 u_color;

            void main() {
              float alpha = texture2D(u_texture, v_texcoord).a;
              if (alpha < 0.1) {
                discard;
              } else {
                gl_FragColor = vec4(u_color, 1);
              }
            }
        `;
        this.prog = new WebGLProgramContext(this.el, vertexShaderCode, fragmentShaderCode,
            ['a_position', 'a_texcoord'],
            ['u_resolution', 'u_color', 'u_texture']);
        this.prog.useProgram();

        this.glVertexCoordBuffer = this.prog.createBuffer()!;
        this.glVertexTextureBuffer = this.prog.createBuffer()!;
        this.glTexture = this.prog.createTexture()!;

        const gl = this.prog.gl;

        // fill a_texcoord static buffer
        this.vertexTextureBuffer.write2Uint8(0, 0);
        this.vertexTextureBuffer.write2Uint8(0, 1);
        this.vertexTextureBuffer.write2Uint8(1, 1);
        this.vertexTextureBuffer.write2Uint8(1, 0);
        this.prog.arrayBuffer(this.glVertexTextureBuffer, 2 * Uint8Array.BYTES_PER_ELEMENT, {
            a_texcoord: {elems: 2, elType: gl.UNSIGNED_BYTE, normalized: false, offsetBytes: 0},
        }, this.vertexTextureBuffer.rawBuffer);


        // temp texture with zero alpha chanel
        this.prog.textureFromBuf('u_texture', this.glTexture, gl.ALPHA, new Uint8Array([0, 0, 0, 0]), 1, 1, gl.UNSIGNED_BYTE, 0, true);

        // logo texture
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const w = image.width;
            const h = image.height;

            this.logo = new Logo(w, h);
            this.prog.textureFromImg('u_texture', this.glTexture, gl.ALPHA, image, gl.UNSIGNED_BYTE, 0, {
                generate: false, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE, minFilter: gl.NEAREST, magFilter: gl.NEAREST,
            });
        }
        image.src = logoUrl;
    }

    private drawNextFrame() {
        window.requestAnimationFrame(this.drawNextFrame.bind(this));

        const gl = this.prog.gl;
        if (!isVisible(gl)) return;
        resizeContext(gl);
        const w = this.prog.width;
        const h = this.prog.height;

        this.prog.useProgram();
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (this.logo === null) return;
        this.logo.update(w, h);

        const rect = this.logo.getRect();
        this.vertexCoordBuffer.clean();
        this.vertexCoordBuffer.write2Uint16(rect[0], rect[1]);
        this.vertexCoordBuffer.write2Uint16(rect[0], rect[3]);
        this.vertexCoordBuffer.write2Uint16(rect[2], rect[3]);
        this.vertexCoordBuffer.write2Uint16(rect[2], rect[1]);
        this.prog.arrayBuffer(this.glVertexCoordBuffer, 2 * Uint16Array.BYTES_PER_ELEMENT, {
            a_position: {elems: 2, elType: gl.UNSIGNED_SHORT, normalized: false, offsetBytes: 0}
        }, this.vertexCoordBuffer.rawBuffer);

        const colorIndex = this.logo.getColorIndex() % (LogoController.COLORS.length / 3);
        this.prog.uniformVector('u_color', LogoController.COLORS[3 * colorIndex], LogoController.COLORS[3 * colorIndex + 1], LogoController.COLORS[3 * colorIndex + 2]);

        this.prog.uniformVector('u_resolution', w, h);
        
        this.prog.drawArrays(gl.TRIANGLE_FAN, 4);
    }
}
