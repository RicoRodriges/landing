WebGL perspective matrix/camera example.

This WebGL program:
- loads texture atlas with 3 textures (wall, floor and ceiling).
- generates maze of custom width and depth without loops and hidden rooms. Any 2 points are reachable.
- _vertex buffer_ is `[0, 1, 2, 3]`. Maze consists of squares. WebGL 1.0 has no `vertexID`.
- _instance buffer_ has:
  - cell coordinate (`[0, 0], [1, 1], ...`) to calculate offset of current square;
  - object type to calculate geometry and texture from atlas. It may be one of 4 walls (left, right, ...), floor or ceiling.
- perspective and lookAt matrixes are used to translate and rotate maze.
- fragment shader uses texture coordinate, which is calculated by vertex shader.