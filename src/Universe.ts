import * as THREE from 'three';
import { Scene } from 'three';

const TRANSPARENT = false;

export class Universe {

    blueNebula: THREE.Mesh;
    pinkNebula: THREE.Mesh;
    yellowNebula: THREE.Mesh;
    background: THREE.CubeTexture | undefined;
    

    constructor(univerSize: number, loadingManager: THREE.LoadingManager) {

        const fileFormat = ".webp";

        const loader = new THREE.TextureLoader(loadingManager);
        loader.setPath('/assets/scene/');
        let materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.3, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.3, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.3, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.3, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.3, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.3, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_back6' + fileFormat) }),
        ];
        let geometry = new THREE.BoxBufferGeometry(univerSize*1.8, univerSize*1.8, univerSize*1.8);
        this.blueNebula = new THREE.Mesh(geometry, materialArray);

        materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.65, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_back6' + fileFormat) }),
        ];
        geometry = new THREE.BoxBufferGeometry(univerSize*2, univerSize*2, univerSize*2);
        this.pinkNebula = new THREE.Mesh(geometry, materialArray);

        materialArray = [
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_right1' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_left2' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_top3' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_bottom4' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_front5' + fileFormat) }),
            new THREE.MeshBasicMaterial({ depthWrite: false, side: THREE.BackSide, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_back6' + fileFormat) }),
        ];
        geometry = new THREE.BoxBufferGeometry(univerSize*2.2, univerSize*2.2, univerSize*2.2);
        this.yellowNebula = new THREE.Mesh(geometry, materialArray);

        //this.createGUI();

    }

    public addToScene(scene: Scene){
        // scene.background=this.background;
        scene.add(this.blueNebula);
        scene.add(this.pinkNebula);
        scene.add(this.yellowNebula);
    }

}