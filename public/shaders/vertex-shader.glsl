precision mediump float;

attribute vec3 a_position;
attribute vec4 a_weight;
attribute vec3 a_normal;

uniform mat4 u_mMatrix;
uniform mat4 u_pMatrix;
uniform mat4 u_boneMatrices[5];
uniform vec3 u_scale;

varying vec3 v_normal;

void main(void) {
	v_normal = a_normal;

	vec3 bonedPos = vec3(0.0);
	vec4 pos = vec4(a_position * u_scale, 1.0);
	float weightSum = 0.0;
	for (int i = 0; i < 4; i++) {
		weightSum += a_weight[i];
		bonedPos += (u_boneMatrices[i] * pos * a_weight[i]).xyz;
	}

	// lol

	float finalWeight = 1.0 - weightSum;
	bonedPos += (u_boneMatrices[4] * pos * finalWeight).xyz;

	gl_Position = u_pMatrix * u_mMatrix * vec4(bonedPos, 1.0);
}