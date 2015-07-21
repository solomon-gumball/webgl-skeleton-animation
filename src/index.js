import { Renderer, AssetLoader } from 'thuglife-webgl';
import { mat4 } from 'gl-matrix';
import Skeleton from './Skeleton';
import Timeline from './Timeline';

AssetLoader.load({
	fromURL: [
		'shaders/vertex-shader.glsl',
		'shaders/fragment-shader.glsl',
		'geometries/skeleton.json'
	]
}).then(initialize)

function initialize (assets) {
	var renderer,
		mMatrix,
		pMatrix,
		cubeJSON;

	/* Create renderer */

	renderer = new Renderer({
		parentEl: document.body,
		vertexShader: assets[0],
		fragmentShader: assets[1],
		attributes: [
			'a_position',
			'a_weight',
			'a_normal'
		],
		uniforms: [
			'u_mMatrix',
			'u_pMatrix',
			'u_boneMatrices[0]',
			'u_scale'
		],
		arrayBuffers: [
			'pos_cube',
			'bone_weights',
			'normal_buffer'
		],
		indexBuffers: ['index_cube'],
		clearColor: [0.0, 0.0, 0.0, 1.0]
	});

	renderer.ctx.enable(renderer.ctx.CULL_FACE);
	renderer.ctx.enable(renderer.ctx.DEPTH_TEST);
	renderer.ctx.depthFunc(renderer.ctx.LEQUAL);

	/*
		Set attribute buffers
	*/

	cubeJSON = JSON.parse(assets[2]);

	cubeJSON.skinWeights = cubeJSON.skinWeights.filter((val, i) => (i + 1) % 5);

	renderer.setBufferData('pos_cube', cubeJSON.vertices, 3);
	renderer.setAttribute('a_position');
	renderer.setBufferData('bone_weights', cubeJSON.skinWeights, 4);
	renderer.setAttribute('a_weight');
	renderer.setBufferData('normal_buffer', cubeJSON.normals, 3);
	renderer.setAttribute('a_normal');

	renderer.setBufferData('index_cube', cubeJSON.indices, 1);
	renderer.setUniform('u_boneMatrices[0]', 'uniform1v', [0, 1, 2, 3, 4]);
	renderer.setUniform('u_scale', 'uniform3fv', [1, 1, 1]);

	// renderer.setUniform('u_scale', 'uniform3fv', [1, 4.6, 1]);

	// console.log("vertices", cubeJSON.vertices.length / 3)
	// console.log("indices", cubeJSON.indices.reduce(function(a, b) { return a > b ? a : b }))
	/*
		Create matrix uniforms
	*/
	mMatrix = mat4.create();
	mat4.translate(mMatrix, mMatrix, [0, 0, -2]);


	pMatrix = mat4.create();
	mat4.perspective(
		pMatrix,
		Math.PI / 1.2,
		innerWidth / innerHeight,
		0, 1000
	);

	renderer.setUniform('u_pMatrix', 'uniformMatrix4fv', pMatrix);
	renderer.setUniform('u_mMatrix', 'uniformMatrix4fv', mMatrix);

	/*
		Create skeleton
	*/

	var skeleton = new Skeleton({
		bones: cubeJSON.bones
	});
	var animation = cubeJSON.animations[0];

	var timeline = new Timeline({
		keyFrames: animation.hierarchy[1].keyFrames
	});
	var timeline2 = new Timeline({
		keyFrames: animation.hierarchy[3].keyFrames
	})

	var boneMatrices = [];
	var timeInitial = Date.now();

	function draw() {		
		renderer.clear();

		/*
			Animate
		*/

		var time = (Date.now() - timeInitial) * 0.001 % 3.35;
		var bone1 = timeline.update(time);
		var bone2 = timeline2.update(time);

		skeleton.updateBone(3, bone2.rot, bone2.pos);
		skeleton.updateBone(1, bone1.rot, bone1.pos);

		mergeArrays(boneMatrices, skeleton.calculateBoneTransforms());
		renderer.setUniform('u_boneMatrices[0]', 'uniformMatrix4fv', boneMatrices);

		mat4.rotate(mMatrix, mMatrix, 0.01, [0, 1, 0]);
		renderer.setUniform('u_mMatrix', 'uniformMatrix4fv', mMatrix);

		/*
			Draw
		*/

		renderer.drawElements('TRIANGLES');

		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}

function mergeArrays(out, arraysArray) {
	out.length = 0;

	for (var i = 0; i < arraysArray.length; i++) {
		out.push.apply(out, arraysArray[i]);
	}

	return out;
}