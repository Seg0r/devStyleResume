// @ts-ignore  
import classicNoise3D from './classicnoise3d.glsl';

const shader = classicNoise3D+`
uniform float progress;
uniform float time;

attribute vec3 centroid1;
attribute vec3 axis;
attribute float offset;

//explosion
varying vec3 eye;
varying vec3 vNormal;
varying vec3 vReflect;

//lava
varying vec2 vUv;
varying float noise;
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

  // float f = iDelta;
  float f = 0.01;




  vNormal2 = normalize(normalMatrix * normal);
  vNormal = normal;

  vec3 newposition = position;

  float vTemp =  1. - ((centroid1.x + centroid1.y)*0.5 + 1.)/2.;

  float tProgress = max(0.0, (progress - vTemp*0.4) /0.6);
  vec3 newnormal = rotate(normal,axis,tProgress*(3. + offset*7.));
  

    // add time to the noise parameters so it's animated
  noise = f * turbulence( .35 * vNormal + 5.5 * time );
  float b = .2 * pnoise( 0.005 * position + vec3( .6 * time ), vec3( 1.0 ) );
  float displacement = noise + b;

  if(progress>0.5){
    newposition = rotate(newposition - centroid1,axis,(1. - vTemp)*tProgress*(3. + offset*10.)) + centroid1;
    newposition += newposition + (1.5 - vTemp)*centroid1*(tProgress)*(3. + vTemp*7. + offset*3.);
  }else{
    vec3 newnormal2 = rotate(normal,axis,(3. + offset*7.));
    // newposition += newposition + newnormal2 * displacement;
  }

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