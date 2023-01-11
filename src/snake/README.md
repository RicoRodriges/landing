Example of `ANGLE_instanced_arrays` extension from WebGL or `gl.draw*Instanced()` from WebGL 2.

This WebGL program:
- has shader, where next data is defined:
  - static _vertex buffer_ with 4 `(x: f32, y: f32)` vertex coordinates. It's square corners.
  - dynamic _instance buffer_:
    - `(i: u16, j: u16)` cell index to calculate offset
    - `u8` flag to mark active cells (with snake or apple) and apply color
- borders are drown as `gl.LINE_LOOP`
- squares inside borders are drown as `gl.TRIANGLE_FAN` and custom `u_padding`
