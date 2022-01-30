import { AdditiveBlending, BufferGeometry, Clock, Group, IUniform, Mesh, MirroredRepeatWrapping, MultiplyBlending, Object3D, Scene, Shader, ShaderMaterial, SphereBufferGeometry, Sprite, SpriteMaterial, TextureLoader, Vector2 } from 'three';

// @ts-ignore  
import lavaFragmentShader from './utils/shaders/lavaFragmentShader.glsl';
// @ts-ignore
import lavaVertexShader from './utils/shaders/lavaVertexShader.glsl';


export class Rock {

    univerSize: number;
    clock: Clock;
    mesh: Mesh<BufferGeometry, ShaderMaterial>;
    tuniform: { [uniform: string]: IUniform<any>; };
    haloSprite!: Sprite;
    coronaSprite!: Sprite;

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
            vertexShader:lavaVertexShader, 
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