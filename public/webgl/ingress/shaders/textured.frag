precision mediump float;
uniform sampler2D u_texture;
uniform vec3      u_color;
varying vec2      v_texCoord;

void main() {
    vec4 color = vec4(u_color, 1.0);
    vec4 sampled = texture2D(u_texture, v_texCoord);
    vec4 mixed = mix(color, vec4(sampled.xyz, color.a), 2.0 * clamp(sampled.w, 0.0, 0.5));
    gl_FragColor = mixed;
}
