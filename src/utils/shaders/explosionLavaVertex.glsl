// Adaptation of Yuri Artiukh algorithm:
// https://github.com/akella/ExplodingObjects
// License: https://github.com/akella/ExplodingObjects#license

// @ts-ignore  
import classicNoise3D from './classicnoise3d.glsl';

const shader = classicNoise3D+`
uniform float progress;
uniform float time;
uniform float inside;

attribute vec3 centroid1;
attribute vec3 axis;
attribute float offset;

//explosion
varying vec3 eye;
varying vec3 vNormal;
varying vec3 vReflect;

//lava
varying vec2 vUv;
varying vec3 eyeVector;
varying vec3 vNormal2;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}



void main() {

  vUv = uv;

  vNormal2 = normalize(normalMatrix * normal);
  vNormal = normal;

  vec3 newposition = position;

  float vTemp =  1.0 - (position.y*0.5 + 1.)/2.;

  float tProgress = max(0.0, (progress - vTemp*0.2) /0.8);

  vec3 newnormal = rotate(normal,axis,tProgress*(3. + offset*10.));


  newposition = rotate(newposition - centroid1,axis,(1. - vTemp)*tProgress*(3. + offset*10.)) + centroid1;
  newposition = newposition + (1.5 - vTemp)*centroid1*(tProgress)*(3. + vTemp*7. + offset*3.);


  vec4 worldPosition = modelViewMatrix * vec4( newposition, 1.0 );

  eye = normalize( vec3( worldPosition ) );
  eyeVector = eye;
  vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * newnormal );
  vec3 I = worldPosition.xyz - cameraPosition;
  vReflect = reflect( I, worldNormal );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newposition, 1.0 );
}
`
export default shader;