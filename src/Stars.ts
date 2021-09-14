import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Camera, Euler, Group, LineBasicMaterial, Quaternion, Scene, Spherical, Vector2, Vector3 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { TriangleBlurShader } from 'three/examples/jsm/shaders/TriangleBlurShader.js';
import { SMAABlendShader } from 'three/examples/jsm/shaders/SMAAShader.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// @ts-ignore
//import {MotionBlurPass} from './threejs-sandbox/motionBlurPass/src/MotionBlurPass.js'


import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

const MAX_POINTS = 100;
const bloomThreshold=0;
const bloomStrength=0.3;
const bloomRadius=0;

interface MeshState{
    mesh:THREE.Mesh; 
    startRotation: number; 
    distance: number;     
}

export class Stars {

    univerSize: number;
    starsGroup: THREE.Group = new Group();
    stars: MeshState[] = [];
    starsLayer: number;
    starsCount: number;
    afterimagePass: any;
    bloomPass: any;
    motionPass: any;
    composer: any;
    camera: THREE.Camera;
    projected: THREE.Mesh[] = [];


    constructor(univerSize: number, starsCount: number, starsLayer: number, renderer: THREE.WebGLRenderer, renderPass: RenderPass, camera: Camera, scene: Scene) {

        this.starsLayer=starsLayer;
        this.camera=camera;
        this.starsCount = starsCount;
        this.univerSize=univerSize*2;

        const sizes = [];
        const material = new LineBasicMaterial({ color: 0xffffff,  linewidth: 1});
        const normal = new Vector3(1,1,1);
        
    
        let vertices: any[] = [];
        const points: any[] = [];

        const center = new Vector3(0,0,0);

        for (let i = 0; i < this.starsCount; i++) {
            vertices = [];

            // let point = new THREE.Vector3().setFromSphericalCoords(univerSize/2, 
            //     THREE.MathUtils.randFloatSpread(2*Math.PI), 
            //     THREE.MathUtils.randFloatSpread(2*Math.PI)
            //     );

            const x = THREE.MathUtils.randFloatSpread(univerSize*3);
            const y = THREE.MathUtils.randFloatSpread(univerSize*3);
            const z = THREE.MathUtils.randFloatSpread(univerSize*3);
    
            vertices.push(x, y, z);


            //const geometry2 = new THREE.OctahedronGeometry(2);
            const geometry2 = new THREE.SphereBufferGeometry(1.3,3,2);
            const material2 = new THREE.MeshBasicMaterial( { color: 0xffffff } );
            const mesh = new THREE.Mesh( geometry2, material2 )
            mesh.position.set(x, y, z);
            this.projected.push(mesh); 
            mesh.scale.set(1,1,1);
            // var helper = new THREE.AxesHelper(20);
            // mesh.add(helper)

            mesh.lookAt(center);
            
            mesh.rotateOnAxis(new Vector3(0,0,1),0);
            
            //mesh.layers.set(starsLayer);

            this.starsGroup.add(mesh);
            //this.stars.push({mesh:mesh,startRotation:mesh.quaternion.clone(), distance:mesh.position.distanceTo(center)});
            this.stars.push({mesh:mesh,startRotation:mesh.rotation.z, distance:mesh.position.distanceTo(center)});
        }

        //this.composer = new EffectComposer( renderer );
        
        //this.composer.addPass( renderPass );

        //this.afterimagePass = new AfterimagePass(0.6);
        //this.composer.addPass( this.afterimagePass );

        // this.bloomPass = new UnrealBloomPass( new THREE.Vector2(  window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio()), 
        //  bloomStrength, bloomRadius, bloomThreshold );
        // this.composer.addPass( this.bloomPass );

        //const antiAA = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
        //this.composer.addPass( antiAA );

        // this.motionPass = new MotionBlurPass( scene, camera, {
        //     samples: 4,
        //     expandGeometry: 0,
        //     interpolateGeometry: 1,
        //     smearIntensity: 4,
        //     blurTransparent: false,
        //     renderCameraBlur: true
        // } );
        // this.composer.addPass( this.motionPass );
        //this.motionPass.renderToScreen = true;

        //const hblur = new ShaderPass( SMAABlendShader );
        //this.composer.addPass( hblur );
        //hblur.renderToScreen=true;

        //this.createGUI();
    }

    // createGUI() {

    //     const _this=this;
    //     const gui = new GUI( { name: 'Damp setting' } );
    //     gui.add( this.afterimagePass.uniforms[ "damp" ], 'value', 0, 1 ).step( 0.001 );
    //     // gui.add( _this.motionPass, 'enabled', true );
    //     const bloomFolder = gui.addFolder('Bloom')
    //     bloomFolder.add(_this.bloomPass, 'threshold', 0,1).step(0.1);
    //     bloomFolder.add(_this.bloomPass, 'strength', 0,10).step(0.1);
    //     bloomFolder.add(_this.bloomPass, 'radius', 0,10).step(0.1);
    //     bloomFolder.add( _this.bloomPass, 'enabled', true );
    //     bloomFolder.open();

    // }

    public addStarsToScene(scene: Scene) {
        scene.add(this.starsGroup);
    }

    timeout = false;

    public render(renderer: THREE.WebGLRenderer, scaleFactor : number, rotationChange: number){

        this.calculateDrawRange(scaleFactor,rotationChange);
        
        // this.camera.layers.set(this.starsLayer);

        // this.composer.render();
        
        // renderer.clearDepth();
        // this.camera.layers.set(0);
    }   


    private calculateDrawRange(scaleFactor : number,
        rotationValue: number){

        // if (scaleFactor<0.001)
        //      scaleFactor=0.001
        //console.group();
        for(let i=0; i < this.stars.length; i++){
            let scaleFactor2=scaleFactor*Math.pow(this.stars[i].distance,1.8)/500;
            //if(scaleFactor2>500) scaleFactor2=500;
            //console.log(scaleFactor2);
            this.stars[i].mesh.scale.set(1+scaleFactor2,1,1);
            this.stars[i].mesh.rotation.z = this.stars[i].startRotation + rotationValue;
        }
        //console.groupEnd();
    }
}