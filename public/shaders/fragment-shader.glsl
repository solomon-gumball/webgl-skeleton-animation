precision mediump float;

varying vec3 v_normal;

void main(void) {
	gl_FragColor = vec4((v_normal + 1.0) * 0.5, 1.0);
}