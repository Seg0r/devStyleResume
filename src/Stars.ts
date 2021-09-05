import * as THREE from 'three';
import { BufferGeometry, Camera, Group, Line, LineBasicMaterial, Matrix4, MeshToonMaterial, Object3D, Points, Quaternion, Scene, Vector3 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

const MAX_POINTS = 100;
const FACTOR = 100;

export class Stars {

    univerSize: number;
    starsGroup: THREE.Group = new Group();
    stars: {mesh:THREE.Mesh, rotation: number}[] = [];
    starsLayer: number;
    starsCount: number;
    afterimagePass: any;
    composer: EffectComposer;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    projected: THREE.Mesh[] = [];

    cameraRotation: Quaternion = new Quaternion();
    state:{
        angle: number,
        startRange: number;
        rangeSize: number;
    } = {angle:0,startRange:MAX_POINTS/2,rangeSize:2};



    constructor(univerSize: number, starsCount: number, starsLayer: number, renderer: THREE.WebGLRenderer, renderPass: RenderPass, camera: Camera) {

        this.starsLayer=starsLayer;
        this.renderer=renderer
        this.camera=camera
        this.starsCount = starsCount;
        this.cameraRotation.copy(this.camera.quaternion)
        this.univerSize=univerSize*2;

        const sizes = [];
        const material = new LineBasicMaterial({ color: 0xffffff,  linewidth: 1});
        const normal = new Vector3(1,1,1);
    
        let vertices: any[] = [];
        const points: any[] = [];

        for (let i = 0; i < this.starsCount; i++) {
            vertices = [];

            let point = new THREE.Vector3().setFromSphericalCoords(univerSize/2, 
                THREE.MathUtils.randFloatSpread(2*Math.PI), 
                THREE.MathUtils.randFloatSpread(2*Math.PI)
                );

            // for(let i = MAX_POINTS/2 ; i> 0; i--){
            //     vertices.push(new Vector3(point.x-i*i,point.y,point.z));
            // }
            // vertices.push(new Vector3(point.x+3,point.y,point.z));
            // for(let i = 0 ; i< MAX_POINTS/2; i++){
            //     vertices.push(new Vector3(point.x+i*i,point.y,point.z));
            // }
            // var geometry = new THREE.BufferGeometry().setFromPoints(vertices);
            // geometry.setDrawRange( MAX_POINTS/2, 2 );
            // const line = new Line(geometry, material);

            // line.computeLineDistances();
            //line.layers.enable(starsLayer);


            const geometry2 = new THREE.OctahedronGeometry(2);
            const material2 = new THREE.MeshBasicMaterial( { color: 0xffffff } );
            const mesh = new THREE.Mesh( geometry2, material2 )
            mesh.position.set(point.x,point.y,point.z)
            this.projected.push(mesh); 
            mesh.scale.set(100,1,1);
            // var helper = new THREE.AxesHelper(20);
            // mesh.add(helper)

            mesh.lookAt(new Vector3(0,0,1));
            
            mesh.rotateOnAxis(new Vector3(0,0,1),0);
            
            
            mesh.layers.enable(starsLayer);

            this.starsGroup.add(mesh);
            this.stars.push({mesh:mesh,rotation:mesh.rotation.z});
        }

        this.composer = new EffectComposer( renderer );
        
        this.composer.addPass( renderPass );

        this.afterimagePass = new AfterimagePass(0.9);
        // this.composer.addPass( this.afterimagePass );

        const antiAA = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
        //antiAA.renderToScreen=true;
        //this.composer.addPass( antiAA );

        //this.createGUI();
    }

    public addStarsToScene(scene: Scene) {
        scene.add(this.starsGroup);
    }

    createGUI() {

        const gui = new GUI( { name: 'Damp setting' } );
        gui.add( this.afterimagePass.uniforms[ "damp" ], 'value', 0, 1 ).step( 0.001 );

    }


    timeout = false;


    public render(renderer: THREE.WebGLRenderer, horizontalFactor: number, verticalFactor: number){

        // if (!this.timeout) {
        //     this.timeout = true;
        //     const _this=this;
        //     this.calculateDrawRange();
        //     setTimeout(function () { _this.timeout = false; }, 200);
        // };

        this.calculateDrawRange(horizontalFactor,verticalFactor);
        
        this.camera.layers.set(this.starsLayer);

        this.composer.render();
        
        this.renderer.clearDepth();
        this.camera.layers.set(0);
    }   


    private calculateDrawRange(horizontalFactor: number, verticalFactor: number){
        
        let factor = verticalFactor/horizontalFactor
        factor = Math.tanh(factor)
        let scaleFactor = Math.max(Math.abs(horizontalFactor),Math.abs(verticalFactor))
        for(let i=0; i < this.stars.length; i++){
            //scaleFactor=scaleFactor*this.univerSize/Math.max(Math.abs(this.stars[i].mesh.position.y),100);
            let scaleFactor2=scaleFactor*(Math.abs(this.stars[i].mesh.position.x)+Math.abs(this.stars[i].mesh.position.z));
            if(scaleFactor2>50)
                scaleFactor2=50;
            this.stars[i].mesh.rotation.z = this.stars[i].rotation + Math.PI/2 *(- factor);
            this.stars[i].mesh.scale.set(1+scaleFactor2,1,1);
        }
        this.cameraRotation.copy(this.camera.quaternion)

        
    }

}