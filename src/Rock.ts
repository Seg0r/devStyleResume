import { Group, ImageUtils, Scene, TextureLoader, Vector2, Vector3 } from 'three';
import { CameraUtils } from './CameraUtils';
import { DEFAULT_UNIVERSE_SIZE } from './main';
import * as THREE from 'three';

const defaultVertexShader = `
varying vec2 vUv; 
void main()
{
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}
`;

// Three js adaptation of:
// Noise animation - Lava by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/lslXRS
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options
const lavaFragmentShader = `
uniform float iTime;
uniform sampler2D iChannel0;
uniform vec2 iResolution;

#define time iTime*0.1

varying vec2 vUv;

float hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float noise( in vec2 x ){return texture(iChannel0, x*.01).x;}

vec2 gradn(vec2 p)
{
	float ep = .09;
	float gradx = noise(vec2(p.x+ep,p.y))-noise(vec2(p.x-ep,p.y));
	float grady = noise(vec2(p.x,p.y+ep))-noise(vec2(p.x,p.y-ep));
	return vec2(gradx,grady);
}

float flow(in vec2 p)
{
	float z=2.;
	float rz = 0.;
	vec2 bp = p;
	for (float i= 1.;i < 7.;i++ )
	{
		//primary flow speed
		p += time*.1;
		
		//secondary flow speed (speed of the perceived flow)
		bp += time*1.9;
		
		//displacement field (try changing time multiplier)
		vec2 gr = gradn(i*p*.34+time*1.);
		
		//rotation of the displacement field
		gr*=makem2(time*6.-(0.05*p.x+0.03*p.y)*40.);
		
		//displace the system
		p += gr*.8;
		
		//add noise octave
		rz+= (sin(noise(p)*7.)*0.5+0.5)/z;
		
		//blend factor (blending displaced system with base system)
		//you could call this advection factor (.5 being low, .95 being high)
		p = mix(bp,p,.77);
		
		//intensity scaling
		z *= 1.4;
		//octave scaling
		p *= 2.;
		bp *= 1.9;
	}
	return rz;	
}

void main()
{	
    vec2 p = -1.0 + 2.0 *vUv;
	p.x *= iResolution.x/iResolution.y;
	p*= 3.;
	float rz = flow(p);
	
	vec3 col = vec3(.2,0.07,0.01)/rz;
	col=pow(col,vec3(1.4));
	gl_FragColor = vec4(col,1.0);
}
`

const testFragmentShader = `
void main() {
	
}
`

export class Rock {

    univerSize: number;
    tuniform: { iTime: { type: string; value: number; }; iChannel0: { type: string; value: THREE.Texture; }; };
    clock: any;
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

    constructor(size: number) {
        this.univerSize = size;
        const rock = this.createRock();
        this.tuniform = rock.uniform;
        this.mesh = rock.mesh;
        this.clock= new THREE.Clock();
    }

    createRock() {

        const tuniform = {
            iTime: { type: 'f', value: 0.1 },
            iChannel0: { type: 't', value: new TextureLoader().load('../assets/noise1.png')},
            iResolution: { type: "v2", value: new THREE.Vector2()}
        };

        tuniform.iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT = THREE.MirroredRepeatWrapping;
        tuniform.iResolution.value.x = 1; // window.innerWidth;
        tuniform.iResolution.value.y = 1; // window.innerHeight;

        const mat = new THREE.ShaderMaterial( {
            uniforms: tuniform,
            vertexShader: defaultVertexShader,
            fragmentShader: lavaFragmentShader,
            // side:THREE.DoubleSide
        } );

        const geo = new THREE.SphereBufferGeometry(700, 700,200,200);

        const mesh =  new THREE.Mesh(geo,mat);

        return {uniform: tuniform, mesh: mesh}
    }

    addToScene(scene: Scene) {
        scene.add( this.mesh );
    }

    render(){
        this.tuniform.iTime.value += this.clock.getDelta();
    }

}