// Adaptation of:
// Vertex displacement with a noise function using GLSL and three.js
// https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/


// @ts-ignore  
import classicNoise3D from './classicnoise3d.glsl';

const shader = classicNoise3D+`

varying vec2 vUv;

uniform float iTime;
uniform float iScale;
uniform float iSaturation;

//Freshnel
varying vec3 vEyeVector;
varying vec3 vNormal;
varying float vNoise;

float turbulence( vec3 p ) {

  float t = -.5;

  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
  }

  return t;

}

void main() {
  
  vUv = uv;

  float f = 100.0;

  // add time to the noise parameters so it's animated
  float noise = f * turbulence( .35 * normal + f/6000.0 * iTime );
  float b = 20.0 * pnoise( 0.005 * position + vec3( .5 * iTime ), vec3( 100.0 ) );
  float displacement = noise + b;
  vec3 newPosition = position + normal * displacement * iSaturation;

  newPosition *= iScale;

  vec4 worldPosition = modelViewMatrix * vec4( newPosition, 1.0 );

  vNormal = normalize(normalMatrix * normal);
  vEyeVector = normalize(vec3(worldPosition));

  gl_Position = projectionMatrix * worldPosition;

}
`;

export default shader;