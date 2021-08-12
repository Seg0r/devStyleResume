import * as THREE from 'three';
import { Scene } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

export class Universe {

    blueNebula: THREE.Mesh;
    pinkNebula: THREE.Mesh;
    yellowNebula: THREE.Mesh;
    stars: THREE.Points;
    starsLayer: number;
    afterimagePass: any;
    composer: EffectComposer;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    

    constructor(starsLayer: number, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {

        this.starsLayer=starsLayer;
        this.renderer=renderer
        this.camera=camera

        const fileFormat = ".jpg";
        const loader = new THREE.TextureLoader();
        loader.setPath('/assets/scene/');
        let materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.5, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('blue_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.5, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('blue_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.5, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('blue_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.5, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('blue_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.5, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('blue_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.5, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('blue_back6' + fileFormat) }),
        ];
        let geometry = new THREE.BoxGeometry(50, 50, 50);
        this.blueNebula = new THREE.Mesh(geometry, materialArray);

        materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_back6' + fileFormat) }),
        ];
        geometry = new THREE.BoxGeometry(100, 100, 100);
        this.pinkNebula = new THREE.Mesh(geometry, materialArray);

        materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_back6' + fileFormat) }),
        ];
        geometry = new THREE.BoxGeometry(150, 150, 150);
        this.yellowNebula = new THREE.Mesh(geometry, materialArray);

        //const starParticles: THREE.Points[] = [];
    
        const vertices = [];
        const sizes = [];
    
        for (let i = 0; i < 1000; i++) {
    
            const x = THREE.MathUtils.randFloatSpread(200);
            const y = THREE.MathUtils.randFloatSpread(200);
            const z = THREE.MathUtils.randFloatSpread(200);
    
            vertices.push(x, y, z);
    
            sizes.push(Math.random() + 0.001);
    
        }
    
        const buffGeometry = new THREE.BufferGeometry();
        buffGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, sizeAttenuation: false });
        buffGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 3));
        this.stars = new THREE.Points(buffGeometry, material);
        this.stars.layers.set(starsLayer);
        

        this.composer = new EffectComposer( renderer );
        this.composer.addPass( new RenderPass( scene, camera ) );

        this.afterimagePass = new AfterimagePass();
        this.composer.addPass( this.afterimagePass );

        this.createGUI();

    }

    public addStarsToScene(scene: Scene) {
        scene.add(this.stars);
    }

    createGUI() {

        const gui = new GUI( { name: 'Damp setting' } );
        gui.add( this.afterimagePass.uniforms[ "damp" ], 'value', 0, 1 ).step( 0.001 );

    }

    public addNebulaToScene(scene: Scene){
        scene.add(this.blueNebula);
        scene.add(this.pinkNebula);
        scene.add(this.yellowNebula);

    }

    public render(){
        this.renderer.clear();
  
        this.camera.layers.set(this.starsLayer);
        this.composer.render();
        
        this.renderer.clearDepth();
        this.camera.layers.set(0);
    }

}