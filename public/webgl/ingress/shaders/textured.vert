attribute vec3 a_position;
attribute vec2 a_texCoord;
uniform   mat4 u_pMatrix;
uniform   mat4 u_mvMatrix;
varying   vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0);
}
