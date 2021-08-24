import * as THREE from 'three';
import { Camera, Scene } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

export class Stars {

    stars: THREE.Points;
    starsLayer: number;
    starsCount: number;
    afterimagePass: any;
    composer: EffectComposer;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    

    constructor(univerSize: number, starsCount: number, starsLayer: number, renderer: THREE.WebGLRenderer, renderPass: RenderPass, camera: Camera) {

        this.starsLayer=starsLayer;
        this.renderer=renderer
        this.camera=camera
        this.starsCount = starsCount;

    
        const vertices = [];
        const sizes = [];
        //this.stars = new THREE.Group();
    
        for (let i = 0; i < this.starsCount; i++) {
    
            const x = THREE.MathUtils.randFloatSpread(univerSize*3);
            const y = THREE.MathUtils.randFloatSpread(univerSize*3);
            const z = THREE.MathUtils.randFloatSpread(univerSize*3);
    
            vertices.push(x, y, z);
    
            sizes.push(Math.random() + 0.001);

            // const buffGeometry = new THREE.SphereGeometry(Math.random()*0.1 + 0.001);
            // const material = new THREE.MeshBasicMaterial({ color: 0xffffff});
            // const star = new THREE.Mesh(buffGeometry, material);
            // star.position.set(x,y,z)
            // star.layers.set(starsLayer);
            // this.stars.add( star );
        }
    
        const buffGeometry = new THREE.BufferGeometry();
        buffGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, sizeAttenuation: false });
        buffGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 3));
        this.stars = new THREE.Points(buffGeometry, material);
        //this.stars.layers.set(starsLayer);
        

        this.composer = new EffectComposer( renderer );
        this.composer.addPass( renderPass );

        this.afterimagePass = new AfterimagePass(0.9);
        this.composer.addPass( this.afterimagePass );

        //this.createGUI();

    }

    public addStarsToScene(scene: Scene) {
        scene.add(this.stars);
    }

    createGUI() {

        const gui = new GUI( { name: 'Damp setting' } );
        gui.add( this.afterimagePass.uniforms[ "damp" ], 'value', 0, 1 ).step( 0.001 );

    }

    public render(){
  
        //this.camera.layers.set(this.starsLayer);
        this.composer.render();
        
        //this.renderer.clearDepth();
        //this.camera.layers.set(0);
    }   

}