// Adaptation of Yuri Artiukh algorithm:
// https://github.com/akella/ExplodingObjects
// License: https://github.com/akella/ExplodingObjects#license

// @ts-ignore  
import lavaColor from './lavaColor.glsl';

const shader = lavaColor+`
uniform float progress;
uniform float inside;
uniform vec3 surfaceColor;
uniform vec3 insideColor;
uniform sampler2D tRock;
uniform float brightness;
uniform float saturation;

uniform float time;
uniform sampler2D iNoise;

#define myTime time*0.05

varying vec2 vUv;
varying vec3 eyeVector;
varying vec3 vNormal2;

varying vec3 eye;
varying vec3 vNormal;
varying vec3 vReflect;


void main()	{
	vec2 p = -1.0 + 2.0 *vUv;

	vec3 r = reflect( eye, vNormal );
	float m = 2. * sqrt( pow( r.x, 2. ) + pow( r.y, 2. ) + pow( r.z + 1., 2. ) );
	vec2 vN = r.xy / m + .5;

	vec3 light = normalize(vec3(12.,10.,10.));
	vec3 light1 = normalize(vec3(-12.,-10.,-10.));
	// vec3 light = normalize(vec3(0.,0.,0.));
	
	float l = clamp(dot(light, vNormal),0.5,1.);
	l += clamp(dot(light1, vNormal),0.5,1.)/2.;
	
	if(inside>0.5){
		gl_FragColor = lavaColor(vUv, vNormal2, eyeVector, myTime,iNoise,brightness,saturation,-1.);
	} else{
		gl_FragColor = vec4(l,l,l,1.)*texture(tRock,p);
	}

}
`
export default shader;