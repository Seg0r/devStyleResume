import { AdditiveBlending, BackSide, BoxBufferGeometry, LoadingManager, Mesh, MeshBasicMaterial, Scene, TextureLoader } from 'three';

const TRANSPARENT = false;

export class Universe {

    blueNebula: Mesh;
    pinkNebula: Mesh;
    yellowNebula: Mesh;
    

    constructor(univerSize: number, loadingManager: LoadingManager) {

        const fileFormat = ".webp";

        const loader = new TextureLoader(loadingManager);
        loader.setPath('/assets/universe/');
        let materialArray = [
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.3, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_right1' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.3, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_left2' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.3, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_top3' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.3, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_bottom4' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.3, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_front5' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.3, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('blue_back6' + fileFormat) }),
        ];
        let geometry = new BoxBufferGeometry(univerSize*1.8, univerSize*1.8, univerSize*1.8);
        this.blueNebula = new Mesh(geometry, materialArray);

        materialArray = [
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.65, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_right1' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.65, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_left2' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.65, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_top3' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.65, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_bottom4' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.65, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_front5' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.65, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('pink_back6' + fileFormat) }),
        ];
        geometry = new BoxBufferGeometry(univerSize*2, univerSize*2, univerSize*2);
        this.pinkNebula = new Mesh(geometry, materialArray);

        materialArray = [
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.8, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_right1' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.8, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_left2' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.8, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_top3' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.8, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_bottom4' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.8, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_front5' + fileFormat) }),
            new MeshBasicMaterial({ depthTest: true, depthWrite: false, side: BackSide, opacity: 0.8, blending: AdditiveBlending, transparent: TRANSPARENT, map: loader.load('yellow_back6' + fileFormat) }),
        ];
        geometry = new BoxBufferGeometry(univerSize*2.2, univerSize*2.2, univerSize*2.2);
        this.yellowNebula = new Mesh(geometry, materialArray);

        this.blueNebula.matrixAutoUpdate = false;
        this.yellowNebula.matrixAutoUpdate = false;
        this.pinkNebula.matrixAutoUpdate = false;

        //this.createGUI();

    }

    public addToScene(scene: Scene){
        scene.add(this.blueNebula);
        scene.add(this.pinkNebula);
        scene.add(this.yellowNebula);
    }

}