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
import { Rot } from './main';


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
    rotationTween:TWEEN.Tween<{ t: number }>|null;

    cameraRotation: Quaternion = new Quaternion();
    state:{
        angle: number,
        startRange: number;
        rangeSize: number;
    } = {angle:0,startRange:MAX_POINTS/2,rangeSize:2};



    constructor(univerSize: number, starsCount: number, starsLayer: number, renderer: THREE.WebGLRenderer, renderPass: RenderPass, camera: Camera, scene: Scene) {

        this.starsLayer=starsLayer;
        this.camera=camera;
        this.starsCount = starsCount;
        this.cameraRotation.copy(this.camera.quaternion);
        this.univerSize=univerSize*2;
        this.rotationTween=null;

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
            mesh.scale.set(100,1,1);
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


    public render(renderer: THREE.WebGLRenderer, horizontalFactor: number, verticalFactor: number,
        scaleFactor : number,
        rotationChange: Rot,
        sync:boolean){

        if (!this.timeout) {
            this.timeout = true;
            const _this=this;
            this.calculateDrawRange(horizontalFactor,verticalFactor,scaleFactor,rotationChange,sync);
            setTimeout(function () { _this.timeout = false; }, 100);
         };

        //this.calculateDrawRange(horizontalFactor,verticalFactor,scaleFactor);
        
        // this.camera.layers.set(this.starsLayer);

        // this.composer.render();
        
        // renderer.clearDepth();
        // this.camera.layers.set(0);
    }   


    private calculateDrawRange(horizontalFactor: number, verticalFactor: number,
        scaleFactor : number,
        rotationChange: Rot,
        sync:boolean){
        
        // @ts-ignore
        let rotationFactor = Math.tanh(verticalFactor/(horizontalFactor+0.000001));

        if (scaleFactor<0.001)
             scaleFactor=0.001
        this.tweenRotation(scaleFactor,rotationFactor,rotationChange,sync);
        //this.tweenScale(scaleFactor);
        this.cameraRotation.copy(this.camera.quaternion)
    }

    lastCoords=0;
    destRotation=new Quaternion();
    destRotation2=new Quaternion();
    nextCoords=0;

    tweenRotation(scaleFactor:number,rotationFactor:number,rotationChange:Rot,sync:boolean){
        if(this.rotationTween)
            this.rotationTween.pause();

        let time = {t:0};
        //const destRotation = Math.PI/2 *(- rotationFactor);
        //this.destRotation.setFromEuler(new Euler(0,0,Math.asin(-rotationFactor)));
        //this.destRotation.setFromAxisAngle(new Vector3(0,0,1),rotationVector)
        //console.log(this.destRotation);
    
        this.rotationTween = new TWEEN.Tween(time)
        .to({t:1}, 100)
        .onUpdate((tween) => {
            for(let i=0; i < this.stars.length; i++){
                let scaleFactor2=scaleFactor*Math.pow(this.stars[i].distance,2)/500;
                if(scaleFactor2>500) scaleFactor2=500;
                this.stars[i].mesh.scale.set(100+scaleFactor2,1,1);
                this.stars[i].mesh.rotation.z = this.stars[i].startRotation + rotationChange.rot;
                //rotationChange.rot=0;
                //if(sync)
                    //this.stars[i].mesh.quaternion.copy(this.stars[i].startRotation);
                //this.stars[i].mesh.quaternion.slerp(this.destRotation2.multiplyQuaternions(this.stars[i].startRotation,this.destRotation),tween.t);
                
            }
        })
        .start();


    }

    

}

function getTweenedValue(startVal:number , endVal:number, currentTime:number, totalTime:number, tweener:(amount: number) => number) {
    var delta = endVal - startVal;
    var percentComplete = currentTime/totalTime;

    return tweener(percentComplete) * delta + startVal;
}