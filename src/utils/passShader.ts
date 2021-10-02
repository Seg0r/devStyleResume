// Author of original script mashafomasha
// https://discourse.threejs.org/t/how-to-use-selective-postprocessing-with-any-pass-other-than-bloompass/17649/2
export const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 vUv;

void main() {
  vec4 base = texture2D(baseTexture, vUv);
  vec4 bloom = texture2D(bloomTexture, vUv);

  gl_FragColor = bloom + base;
}
`;
