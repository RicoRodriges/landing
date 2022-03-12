// ---------------------------
// Shader function
// ---------------------------
export function createShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type);
    if (shader) {
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }

        console.error(gl.getShaderInfoLog(shader));
        deleteShader(gl, shader);
    }
    throw new Error('Shader couldn\'t be compiled');
}

export function deleteShader(gl: WebGLRenderingContext, shader: WebGLShader) {
    gl.deleteShader(shader);
}


// ---------------------------
// Program function
// ---------------------------
export function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram();
    if (program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            return program;
        }

        console.error(gl.getProgramInfoLog(program));
        deleteProgram(gl, program);
    }
    throw new Error('Program couldn\'t be created');
}

export function createProgramFromScripts(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string) {
    return createProgram(gl,
        createShader(gl, gl.VERTEX_SHADER, vertexShader),
        createShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
}

export function deleteProgram(gl: WebGLRenderingContext, program: WebGLProgram) {
    gl.deleteProgram(program);
}

// ---------------------------
// Canvas operations
// ---------------------------
export function resizeContext(gl: WebGLRenderingContext) {
    const canvas = gl.canvas;

    const dpr = window.devicePixelRatio;
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);

    if (canvas.width != displayWidth ||
        canvas.height != displayHeight) {

        canvas.width = displayWidth;
        canvas.height = displayHeight;

        gl.viewport(0, 0, displayWidth, displayHeight);
    }
}

export function isVisible(gl: WebGLRenderingContext) {
    const canvas = gl.canvas;

    const rect = canvas.getBoundingClientRect();
    const top = rect.top;
    const bottom = rect.bottom;

    const height = window.innerHeight;
    return bottom > 0 && top < height;
}
