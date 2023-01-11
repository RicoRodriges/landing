Example of `gl.ELEMENT_ARRAY_BUFFER` and `gl.ARRAY_BUFFER`.

This WebGL program:
- has single _vertex buffer_ with tuples `(x: u16, y: u16)` of particle coordinates on the screen.
  - particles are drawn by `gl.drawArrays(gl.POINTS)` call.
- for links between particles the program has _index buffer_ with tuples `(i: u16, j: u16)` of particle indexes from _vertex buffer_.
  - links are drawn by `gl.drawElements(gl.LINES)` call.