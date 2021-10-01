
import * as THREE from 'three';
import {Camera, CatmullRomCurve3, MeshBasicMaterial, NormalBlending, Scene, Sprite, TubeBufferGeometry, Vector3 } from 'three';
import { DirectionAngles } from './SolarSystem';
import { gaussianRandom } from './utils/math';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { createFinalPass } from "./utils/pass";


enum Layers{
    MARKERS,
    FIELD
}

const MARKERS_SPEED = 0.0015;

const fieldOpacity = 0.015;
const spriteScale = 10;
export class MagneticField {

    curves:{curve:CatmullRomCurve3,seed: number}[] = [];
    markers: Sprite[] = [];
    lines: any[] = [];
    bloomComposer: EffectComposer;
    scene: Scene;
    camera: Camera;
    renderer: THREE.WebGLRenderer;

    uBloomParam = {strength:2, radius: 2, threshold: 0.0};
    parameters= {horizBlur:10.0 , vertiBlur: 0.0};
    finalComposer: EffectComposer;

    public constructor(center: Vector3, size: number, count: number, initAngles: DirectionAngles,
         renderer: THREE.WebGLRenderer,scene: Scene, camera: THREE.Camera) {

        this.renderer=renderer;
        this.camera=camera;
        this.bloomComposer = new EffectComposer(this.renderer );
        this.finalComposer = new EffectComposer(this.renderer );
        this.scene = scene;

        this.bornField(count, center, size,initAngles);
        
        this.setupComposers();

        //this.createGUI();
    }

    setupComposers()
    {
        const renderPass = new RenderPass( this.scene, this.camera ) 
        
        this.bloomComposer = new EffectComposer(this.renderer );
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass(renderPass);

        var effectBloom = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ),
        this.uBloomParam.strength, this.uBloomParam.radius, this.uBloomParam.threshold );


        var effectHorizBlur = new ShaderPass( HorizontalBlurShader );
        var effectVertiBlur = new ShaderPass( VerticalBlurShader );
        effectHorizBlur.uniforms[ "h" ].value = this.parameters.horizBlur / window.innerWidth;
        effectVertiBlur.uniforms[ "v" ].value = this.parameters.horizBlur / window.innerHeight;

        this.bloomComposer.addPass( effectBloom );
        this.bloomComposer.addPass( effectHorizBlur );
        this.bloomComposer.addPass( effectVertiBlur );

        //finalComposer - for normal render
        this.finalComposer.addPass(renderPass);
        const finalPass = createFinalPass(
            this.bloomComposer
        );
        this.finalComposer.addPass(finalPass);
    }

    createGUI() {


        const _this = this;

        const gui = new GUI()

        const bloom2Folder = gui.addFolder('Bloom')
        bloom2Folder.add(this.uBloomParam, 'strength', 0,10).step(0.1).onChange(
            function(value)
            {   _this.setupComposers();   }
        );
        bloom2Folder.add(_this.uBloomParam, 'radius', 0,5).step(0.1).onChange(
            function(value)
            {   _this.setupComposers();   }
        );
        bloom2Folder.add(_this.uBloomParam, 'threshold', 0,1).step(0.1).onChange(
            function(value)
            {   _this.setupComposers();   }
        );
        bloom2Folder.open();

        const blurFolder = gui.addFolder('Blur')
        blurFolder.add(this.parameters, 'horizBlur', 0,10).step(0.1).onChange(
            function(value)
            {   _this.setupComposers();   }
        );
        blurFolder.open()


        //gui.close();
    }

    private bornField(count: number, center: THREE.Vector3, size: number,initAngles: DirectionAngles) {

        const MAX_POINTS = 200;       
        const material = new MeshBasicMaterial({ color: 0x0099ff , transparent: true,opacity: fieldOpacity, blending: NormalBlending});

        const particleTexture = new THREE.TextureLoader().load( 'assets/spark.png' );
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: particleTexture, 
            depthTest: false,
            color: 0xffffff});
        
        for ( let i = 0; i < count; i ++ ) {

            var sprite = new THREE.Sprite( spriteMaterial );
            sprite.scale.set( spriteScale, spriteScale, 1.0 );
            sprite.material.blending = THREE.AdditiveBlending;
            sprite.layers.enable(Layers.MARKERS);
            this.markers.push(sprite);
            var sprite2 = sprite.clone();
            this.markers.push(sprite2);

            const xRadius = gaussianRandom(size*2,size*3);
            
            const curve2 = new THREE.EllipseCurve(
                center.x+xRadius,  center.y,            // ax, aY
                xRadius, xRadius*0.8,           // xRadius, yRadius
                0,  2 * Math.PI,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );

            const points3: Vector3[] = [];
            const positions = new Float32Array( MAX_POINTS * 3 );
            let i=0;
            curve2.getPoints( MAX_POINTS ).forEach((e) => {
                points3.push(new Vector3(e.x,e.y,0))
                positions[i++]=e.x;
                positions[i++]=e.y;
                positions[i++]=0.0;
            });

            const curve = new CatmullRomCurve3(points3,true);
            const geometry = new TubeBufferGeometry(curve,64,10,10,true);
            const fieldLines =  new THREE.Mesh( geometry, material );
            fieldLines.layers.enable(Layers.FIELD);
            fieldLines.add(sprite);
            fieldLines.add(sprite2);

            let rot = 0;
            while(Math.PI*0.15> rot && rot > -Math.PI*0.05){
                rot = Math.random()*Math.PI*2 - Math.PI;
            }
            
            fieldLines.rotateZ(-initAngles.beta2);
            fieldLines.rotateX(-initAngles.alpha1);
            fieldLines.rotateY(rot);
            
            const seed = Math.random();

            this.curves.push({curve:curve,seed:seed});
            this.lines.push(fieldLines)
        }

        for ( let i = 0; i < count; i ++ ) {
            var sprite = new THREE.Sprite( spriteMaterial );
            sprite.scale.set( spriteScale, spriteScale, 1.0 );
            sprite.material.blending = THREE.AdditiveBlending; 
            sprite.layers.enable(Layers.MARKERS);
            this.markers.push(sprite);
            var sprite2 = sprite.clone();
            this.markers.push(sprite2);

            const xRadius = gaussianRandom(size*250,size*300);
            const ax = xRadius ;
            const curve2 = new THREE.EllipseCurve(
                center.x+ax,  center.y,            // ax, aY
                xRadius, xRadius*0.25,           // xRadius, yRadius
                Math.PI/1.08,   -Math.PI/1.08,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
             );

            const points3: Vector3[] = [];

            curve2.getPoints( 200 ).forEach(element => {
                points3.push(new Vector3(element.x,element.y,0))
            });

            const curve = new CatmullRomCurve3(points3,false);
            const geometry = new TubeBufferGeometry(curve,64,10,10,false);
            const fieldLines =  new THREE.Mesh( geometry, material );
            fieldLines.layers.enable(Layers.FIELD);
            fieldLines.add(sprite);
            fieldLines.add(sprite2);

            const rot = Math.random()*Math.PI*4 - Math.PI*2
            fieldLines.rotateZ(-initAngles.beta2);
            fieldLines.rotateX(-initAngles.alpha1);
            fieldLines.rotateY(rot);

            const seed = Math.random();

            this.curves.push({curve:curve,seed:seed});
            this.lines.push(fieldLines)
        }
    }
    

    public addToScene(scene: Scene) {
        this.lines.forEach(element => {
            this.scene.add(element)
        });
    }

    t =0;

    public render(){
        
        for(let i=0;i<this.curves.length;i++){
            var t = this.t + this.curves[i].seed;
            if(t>1) t-=1;
            var pos = this.curves[i].curve.getPoint(t);
            this.markers[i*2].position.set( pos.x, pos.y, pos.z );
            var t = this.t + this.curves[i].seed+0.5;
            if(t>1) t-=1;
            var pos = this.curves[i].curve.getPoint(t);
            this.markers[i*2+1].position.set( pos.x, pos.y, pos.z );
        }
        this.t = (this.t >= 1) ? 0 : this.t += MARKERS_SPEED;

        this.composeRender();
    }

    composeRender() {
      

        this.camera.layers.set(Layers.FIELD);
        this.bloomComposer.swapBuffers();
        this.bloomComposer.render();
      
        this.camera.layers.set(Layers.MARKERS);
        this.finalComposer.swapBuffers();
        this.finalComposer.render();
      }

}