attribute vec3  a_position;
attribute vec2  a_texCoord;
uniform   mat4  u_pMatrix;
uniform   mat4  u_mvMatrix;
uniform   float u_elapsedTime;
varying   vec2  v_texCoord;
varying   vec4  v_texCoord0And1;

void main() {
    v_texCoord = a_texCoord;
    v_texCoord0And1  = vec4(a_texCoord, a_texCoord * 1.35);
    v_texCoord0And1 += vec4(0, u_elapsedTime * 0.6, u_elapsedTime * 0.6, u_elapsedTime * 0.45);
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0);
}
