// @ts-ignore  
import lavaColor from './lavaColor.glsl';

const shader = lavaColor+`

uniform float iTime;
uniform sampler2D iNoise;
uniform float iBrightness;
uniform float iSaturation;
uniform float iHue;

#define myTime iTime*0.08

varying vec2 vUv;
varying vec3 vEyeVector;
varying vec3 vNormal;

void main()	{
	gl_FragColor = lavaColor(vUv, vNormal, vEyeVector, myTime,iNoise,iBrightness,iSaturation,iHue);
}
`
export default shader;