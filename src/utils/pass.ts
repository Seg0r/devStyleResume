// Author of original script mashafomasha
// https://discourse.threejs.org/t/how-to-use-selective-postprocessing-with-any-pass-other-than-bloompass/17649/2

import { ShaderMaterial } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { vertexShader, fragmentShader } from "./passShader";

export const createFinalPass = (
  bloomComposer:EffectComposer
) => {
  const finalPass = new ShaderPass(
    new ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader,
      fragmentShader,
      defines: {}
    }),
    "baseTexture"
  );
  finalPass.renderToScreen = true;

  return finalPass;
};
