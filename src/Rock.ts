import { AdditiveBlending, BufferGeometry, Clock, Group, IUniform, Mesh, MirroredRepeatWrapping, MultiplyBlending, Object3D, Scene, Shader, ShaderMaterial, SphereBufferGeometry, Sprite, SpriteMaterial, TextureLoader, Vector2 } from 'three';
// @ts-ignore  
import {classicNoise3D} from './utils/classicnoise3d.glsl';

const defaultVertexShader =classicNoise3D+`

varying vec2 vUv;
varying float noise;
uniform float iTime;

float turbulence( vec3 p ) {

  float w = 100.0;
  float t = -.5;

  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
  }

  return t;

}

void main() {

vUv = uv;

  // add time to the noise parameters so it's animated
  noise = 1000.0 *  -.10 * turbulence( .5 * normal + .1 * iTime );
  float b = 50.0 * pnoise( 0.005 * position + vec3( .5 * iTime ), vec3( 100.0 ) );
  float displacement = - noise + b;

  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

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
		z *= 1.7;
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
	
	vec3 col = vec3(.13,0.07,0.01)/rz;
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
    clock: Clock;
    mesh: Mesh<BufferGeometry, ShaderMaterial>;
    tuniform: { [uniform: string]: IUniform<any>; };
    haloSprite: Sprite;
    coronaSprite: Sprite;

    constructor(size: number) {
        this.univerSize = size;
        const {uniform,mesh} = this.createRock();
        this.tuniform = uniform;
        this.mesh = mesh;
        this.clock= new Clock();
        this.createHalo();
    }

    createHalo() {


        const halo = new TextureLoader().load( '../assets/rock/halo2.png' );
        const corona = new TextureLoader().load( '../assets/rock/corona3.png' );
        const alphaMap = new TextureLoader().load( '../assets/rock/alpha.png' );
        // alphaMap.repeat.set(0.5, 0.5);
        // alphaMap.offset.set(0.4,0.4);
        const haloMat = new SpriteMaterial( { 
            map: halo, 
            blending: AdditiveBlending, 
            color: 0xfe9501,
            opacity:0.6
        } );

        const coronaMat = new SpriteMaterial( { 
            map: corona, 
            blending: AdditiveBlending, 
            color: 0xfecb01,
            opacity:1
        } );

        this.haloSprite = new Sprite( haloMat );
        this.coronaSprite = new Sprite( coronaMat );
        this.haloSprite.scale.set(10000, 10000, 1)
        this.coronaSprite.scale.set(8000, 8000, 1);
        // coronaSprite.scale.set(5000, 5000, 1);

        this.coronaSprite.position.set(-400,0,400);

    }

    createRock() {

        const shader = Rock.lavaShader();

        const mat = new ShaderMaterial({
            uniforms: shader.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
        });

        const geo = new SphereBufferGeometry(600, 600,40,40);

        const mesh =  new Mesh(geo,mat);

        return {uniform: shader.uniforms, mesh: mesh}
    }

    static lavaShader(): Shader {
        const tuniform = {
            iTime: { type: 'f', value: 0.1 },
            iChannel0: { type: 't', value: new TextureLoader().load('../assets/noise1.png') },
            iResolution: { type: "v2", value: new Vector2() }
        };

        tuniform.iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT = MirroredRepeatWrapping;
        tuniform.iResolution.value.x = 1; // window.innerWidth;
        tuniform.iResolution.value.y = 1; // window.innerHeight;

        const shader: Shader = {
            uniforms:tuniform,
            vertexShader:defaultVertexShader, 
            fragmentShader:lavaFragmentShader
        };

        return shader;
    }

    addToScene(scene: Scene) {
        scene.add( this.mesh );
        scene.add(this.coronaSprite);
        scene.add(this.haloSprite)
    }

    timer = 0;

    render(){
        this.timer+=0.5;
        this.tuniform.iTime.value += this.clock.getDelta();
        this.coronaSprite.material.rotation +=0.001;
        this.coronaSprite.scale.addScalar(10*Math.sin(this.timer));
        
        this.haloSprite.material.rotation -=0.001;
        this.haloSprite.scale.addScalar(100*Math.cos(this.timer));
    }

}