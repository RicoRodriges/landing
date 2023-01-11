WebGL texture example.

This WebGL program:
- loads `svg` picture and rasterizes by canvas drawing.
- loads rasterized picture as `gl.ALPHA` texture.
- fragment shader uses custom color and alpha chanel from texture to draw logo.
