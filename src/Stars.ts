import * as THREE from 'three';
import { BufferGeometry, Camera, Group, Line, LineBasicMaterial, Matrix4, Object3D, Points, Quaternion, Scene, Vector3 } from 'three';
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

    starsGroup: THREE.Group = new Group();
    stars: {star: Line, point: Vector3}[] = [];
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
        this.starsCount = 5;
        this.cameraRotation.copy(this.camera.quaternion)
        //univerSize = 500

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

            //const lineGeometry = new BufferGeometry();
            //lineGeometry.setFromPoints([point,new Vector3(point.x+5,point.y+5,point.z+5)]);

            // geometry
            

            // attributes
            //geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( MAX_POINTS * 3 ), 3 ) );
            for(let i = MAX_POINTS/2 ; i> 0; i--){
                vertices.push(new Vector3(point.x-i*i,point.y,point.z));
            }
            vertices.push(new Vector3(point.x+3,point.y,point.z));
            for(let i = 0 ; i< MAX_POINTS/2; i++){
                vertices.push(new Vector3(point.x+i*i,point.y,point.z));
            }
            var geometry = new THREE.BufferGeometry().setFromPoints(vertices);
            //geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            //lineGeometry.setPositions([point.x-100,point.y,point.z,point.x,point.y,point.z,point.x+100,point.y,point.z]);
            geometry.setDrawRange( MAX_POINTS/2, 2 );
            const line = new Line(geometry, material);

            line.computeLineDistances();
            line.layers.enable(starsLayer);
            line.lookAt(new Vector3(0,0,0));

            
            const geometry2 = new THREE.BoxBufferGeometry( 50,50,50);
            const material2 = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
            const mesh = new THREE.Mesh( geometry2, material2 )
            mesh.position.set(point.x,0,point.z)

            this.projected.push(mesh); 

            const material3 = new THREE.MeshStandardMaterial( { color: 0x0000ff } );
            const mesh2 = new THREE.Mesh( geometry2, material3 )
            mesh2.position.set(point.x,point.y,point.z)
            const before = new Quaternion().copy(mesh2.quaternion);
            mesh2.lookAt(new Vector3(0,0,0));
            const after = mesh2.quaternion.clone();
            line.applyQuaternion(mesh2.quaternion);
            this.projected.push(mesh2); 

            //line.rotateOnAxis(new Vector3(0,1,0),projected.angleTo(normal));
            
            this.starsGroup.add(line);
            this.stars.push({star:line,point:point});
            //vertices.push(buffGeometry);   
        }



    
        //const buffGeometry = new THREE.BufferGeometry();
        //buffGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        //const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(vertices);
        
        
        //this.stars.layers.enable(starsLayer);
        

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
        this.projected.forEach(element => {
            scene.add( element);    
        });
        
    }

    createGUI() {

        const gui = new GUI( { name: 'Damp setting' } );
        gui.add( this.afterimagePass.uniforms[ "damp" ], 'value', 0, 1 ).step( 0.001 );

    }


    timeout = false;


    public render(renderer: THREE.WebGLRenderer){

        if (!this.timeout) {
            this.timeout = true;
            const _this=this;
            this.calculateDrawRange();
            setTimeout(function () { _this.timeout = false; }, 200);
        };
        
        this.camera.layers.set(this.starsLayer);

        this.composer.render();
        
        this.renderer.clearDepth();
        this.camera.layers.set(0);
    }   

    private calculateDrawRange(){
        let currAngle  = Math.round(this.cameraRotation.angleTo(this.camera.quaternion)*100)/100
        let factor = currAngle/(this.state.angle+0.5)

        if(factor>1)
            factor=1;

        this.state.startRange=MAX_POINTS/2-(factor*MAX_POINTS/2)-9
        this.state.rangeSize=20+factor*MAX_POINTS

        if(this.state.startRange<0)
            this.state.startRange=0;

        console.log(factor,currAngle,this.state);
        for(let i=0; i < this.stars.length; i++){
            this.stars[i].star.geometry.setDrawRange(this.state.startRange,this.state.rangeSize)
        }

        this.state.angle=currAngle;

        this.cameraRotation.copy(this.camera.quaternion)
    }

}