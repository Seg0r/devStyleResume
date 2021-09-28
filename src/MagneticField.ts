
import * as THREE from 'three';
import {AdditiveBlending, Camera, CatmullRomCurve3, Line, Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshToonMaterial, MultiplyBlending, NoBlending, NormalBlending, Scene, Sprite, SubtractiveBlending, TubeBufferGeometry, Vector3 } from 'three';
import { DirectionAngles } from './SolarSystem';
import { gaussianRandom } from './utils/math';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';


export class MagneticField {

    curves:{curve:CatmullRomCurve3,seed: number}[] = [];
    //markers: Mesh[] = [];
    markers: Sprite[] = [];
    lines: any[] = [];
    composer: EffectComposer;
    scene: Scene;
    camera: Camera;
    renderer: THREE.WebGLRenderer;

    uBloomParam = {strength:0.5, radius: 1.5, threshold: 0.0};
    parameters= {horizBlur:0.0 , vertiBlur: 0.0};

    public constructor(center: Vector3, size: number, count: number, initAngles: DirectionAngles,
         renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {

        this.bornField(count, center, size,initAngles);

        this.renderer=renderer;
        this.camera=camera;
        this.composer = new EffectComposer(this.renderer );
        this.scene = new Scene();
        
        this.setupShaderBloom();

        this.createGUI();
    }

    setupShaderBloom()
    {
        this.composer = new EffectComposer(this.renderer );
        this.composer.addPass( new RenderPass( this.scene, this.camera ) );

        var effectBloom = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ),
        this.uBloomParam.strength, this.uBloomParam.radius, this.uBloomParam.threshold );
        this.composer.addPass( effectBloom );

        var effectHorizBlur = new ShaderPass( HorizontalBlurShader );
        var effectVertiBlur = new ShaderPass( VerticalBlurShader );
        effectHorizBlur.uniforms[ "h" ].value = this.parameters.horizBlur / window.innerWidth;
        effectVertiBlur.uniforms[ "v" ].value = this.parameters.horizBlur / window.innerHeight;
        
        
        this.composer.addPass( effectHorizBlur );
        this.composer.addPass( effectVertiBlur );

        var fxaaPass = new ShaderPass( FXAAShader );

        var pixelRatio = this.renderer.getPixelRatio();
        var uniforms = fxaaPass.material.uniforms;

        uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
        uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );

        fxaaPass.renderToScreen = true;
    }

    createGUI() {


        const _this = this;

        const gui = new GUI()

        const bloom2Folder = gui.addFolder('Bloom')
        bloom2Folder.add(this.uBloomParam, 'strength', 0,10).step(0.1).onChange(
            function(value)
            {   _this.setupShaderBloom();   }
        );
        bloom2Folder.add(_this.uBloomParam, 'radius', 0,5).step(0.1).onChange(
            function(value)
            {   _this.setupShaderBloom();   }
        );
        bloom2Folder.add(_this.uBloomParam, 'threshold', 0,1).step(0.1).onChange(
            function(value)
            {   _this.setupShaderBloom();   }
        );
        bloom2Folder.open();

        const blurFolder = gui.addFolder('Blur')
        blurFolder.add(this.parameters, 'horizBlur', 0,10).step(0.1).onChange(
            function(value)
            {   _this.setupShaderBloom();   }
        );
        blurFolder.add(_this.parameters, 'vertiBlur', 0,10).step(0.1).onChange(
            function(value)
            {   _this.setupShaderBloom();   }
        );
        blurFolder.open();
        //gui.close();
    }

    private bornField(count: number, center: THREE.Vector3, size: number,initAngles: DirectionAngles) {

        const MAX_POINTS = 200;

        

        var particleTexture = new THREE.TextureLoader().load( 'assets/spark.png' );
        var spriteMaterial = new THREE.SpriteMaterial( { 
            map: particleTexture, 
            depthTest: false,
            color: 0xb5deff});
        
        const  material = new MeshBasicMaterial({ color: 0x0099ff , transparent: true,opacity: 0.1, blending: NormalBlending});

        
        for ( let i = 0; i < count; i ++ ) {

            var sprite = new THREE.Sprite( spriteMaterial );
            sprite.scale.set( 20, 20, 1.0 );
            sprite.material.blending = THREE.AdditiveBlending; 
            const mesh = sprite;
            this.markers.push(mesh);

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
            const points = curve.getPoints( 20 );
``
            const geometry = new TubeBufferGeometry(curve,64,10,10,true);
            const fieldLines =  new THREE.Mesh( geometry, material );

            fieldLines.geometry.computeVertexNormals();
            fieldLines.add(mesh);

            const rot = Math.random()*Math.PI*2 - Math.PI;
            
            fieldLines.rotateZ(-initAngles.beta2);
            fieldLines.rotateX(-initAngles.alpha1);
            fieldLines.rotateY(rot);
            
            const seed = Math.random();

            this.curves.push({curve:curve,seed:seed});
            this.lines.push(fieldLines)
        }

        // for ( let i = 0; i < count; i ++ ) {
        //     var sprite = new THREE.Sprite( spriteMaterial );
        //     sprite.scale.set( 20, 20, 1.0 );
        //     sprite.material.blending = THREE.AdditiveBlending; 
        //     const mesh = sprite;
        //     this.markers.push(mesh);

        //     const xRadius = gaussianRandom(size*250,size*300);
        //     const ax = xRadius ;
        //     const curve2 = new THREE.EllipseCurve(
        //         center.x+ax,  center.y,            // ax, aY
        //         xRadius, xRadius*0.25,           // xRadius, yRadius
        //         Math.PI/1.08,   -Math.PI/1.08,  // aStartAngle, aEndAngle
        //         false,            // aClockwise
        //         0                 // aRotation
        //      );

        //     const points3: Vector3[] = [];

        //     curve2.getPoints( 200 ).forEach(element => {
        //         points3.push(new Vector3(element.x,element.y,0))
        //     });

        //     const curve = new CatmullRomCurve3(points3,false);
        //     const points = curve.getPoints( 200 );
        //     //const geometry = new THREE.BufferGeometry().setFromPoints( points );
        //     const geometry = new LineGeometry();
        //     const positions:number[] = [];
        //     points.forEach(e => {
        //         positions.push(e.x,e.y,e.z);
        //     });
        //     geometry.setPositions( positions );
        //     const fieldLines = new Line2(geometry, matLine);
        //     fieldLines.computeLineDistances();

        //     // const geometry = new THREE.TubeBufferGeometry(curve,64,10,10)
        //     // const fieldLines =  new THREE.Mesh( geometry, material );
        //     fieldLines.add(mesh);

        //     const rot = Math.random()*Math.PI*4 - Math.PI*2
        //     fieldLines.rotateZ(-initAngles.beta2);
        //     fieldLines.rotateX(-initAngles.alpha1);
        //     fieldLines.rotateY(rot);

        //     const seed = Math.random();

        //     this.curves.push({curve:curve,seed:seed});
        //     this.lines.push(fieldLines)
        // }
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
            this.markers[i].position.set( pos.x, pos.y, pos.z );
        }
        this.t = (this.t >= 1) ? 0 : this.t += 0.001;

        
        this.composer.render();
    }
}