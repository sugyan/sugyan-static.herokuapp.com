precision mediump float;
uniform sampler2D u_texture;
varying vec2      v_texCoord;
varying vec4      v_texCoord0And1;

void main() {
    vec4 base = texture2D(u_texture, v_texCoord0And1.xy);
    vec4 scrolled = texture2D(u_texture, v_texCoord0And1.zw * 1.35);
    float blend_mask = ((base.g * scrolled.g) + (base.r * scrolled.r)) * 2.0;
    vec4 colorTint = mix(vec4(1.0, 0.5, 1.0, 1.0), vec4(1.0), blend_mask - 0.25);
    gl_FragColor   = colorTint + vec4(blend_mask) - vec4(1.0);
    gl_FragColor.a = 1.0;
}
