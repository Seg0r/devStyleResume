import * as THREE from 'three';
import { Scene } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { Group } from '@tweenjs/tween.js';

export class Universe {

    blueNebula: THREE.Mesh;
    pinkNebula: THREE.Mesh;
    yellowNebula: THREE.Mesh;
    stars: THREE.Points;
    starsLayer: number;
    starsCount: number;
    afterimagePass: any;
    composer: EffectComposer;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    

    constructor(univerSize: number, starsCount: number, starsLayer: number, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {

        this.starsLayer=starsLayer;
        this.renderer=renderer
        this.camera=camera
        this.starsCount = starsCount;

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
        let geometry = new THREE.BoxGeometry(univerSize, univerSize, univerSize);
        this.blueNebula = new THREE.Mesh(geometry, materialArray);

        materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('pink_back6' + fileFormat) }),
        ];
        geometry = new THREE.BoxGeometry(univerSize*2, univerSize*2, univerSize*2);
        this.pinkNebula = new THREE.Mesh(geometry, materialArray);

        materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, map: loader.load('yellow_back6' + fileFormat) }),
        ];
        geometry = new THREE.BoxGeometry(univerSize*3, univerSize*3, univerSize*3);
        this.yellowNebula = new THREE.Mesh(geometry, materialArray);

        //const starParticles: THREE.Points[] = [];
    
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
        this.stars.layers.set(starsLayer);
        

        this.composer = new EffectComposer( renderer );
        const renderPass = new RenderPass( scene, camera );
        this.composer.addPass( renderPass );

        //this.afterimagePass = new AfterimagePass();
        //this.composer.addPass( this.afterimagePass );

        const pass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
        this.composer.addPass( pass );


        //this.createGUI();

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