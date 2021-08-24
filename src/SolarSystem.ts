import * as THREE from 'three';
import { Box3, BufferGeometry, DodecahedronGeometry, Group, Light, LineSegments, Material, Matrix4, Mesh, MeshToonMaterial, Object3D, PointLight, Quaternion, Scene, SphereGeometry, TextureLoader, Vector3 } from "three";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import * as UTILS from './utils/applyUV'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


enum MoonOrbits {
    First,
    Second
}

const alpha1=0.3;
const alpha2=0.4;
const beta1=1.3;
const beta2=-0.8;

const alphaDist=1.2;
const betaDist=1.4;

const sunLightStrength=120;
const sunLightDecay=6;

const bloomThreshold=0.9;
const bloomStrength=1;
const bloomRadius=2;


export class SolarSystem {

    private solarSystem: Group;
    private orbiters: Mesh[] = [];
    private orbiterPivots: Object3D[] = [];
    private orbiterSpeeds: number[] = [];

    private moons: Mesh[] = [];
    private moonPivots: Object3D[] = [];
    private moonSpeeds: number[] = [];

    //private sunMesh: Mesh;
    private sunLight: PointLight;
    private sunLightStrength: number = sunLightStrength;
    private sunLightDecay: number = sunLightDecay;
    visible: Boolean = false;
    private lensflare: Lensflare;

    //postprocessing
    composer: EffectComposer;
    renderer: THREE.WebGLRenderer;
    bloomPass: UnrealBloomPass;
    bloomPassToggle: boolean = true;

    public constructor(center: Vector3, size: number, count: number, renderer: THREE.WebGLRenderer, renderPass: RenderPass) {

        this.solarSystem = new Group();

        this.bornOrbiters(count, center, size);

        this.sunLight = new PointLight(0xfe9b14, this.sunLightStrength, size*3, this.sunLightDecay);
        this.sunLight.position.copy(center);

        this.lensflare = this.createLensflare(size);

        this.bornMoons(count, center, size,alpha1,alpha2,alphaDist);
        this.bornMoons(count*1.2, center, size,beta1,beta2,betaDist);        

        this.renderer=renderer;

        this.composer = new EffectComposer( renderer );
        
        this.composer.addPass( renderPass );

        const antiAA = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
        this.composer.addPass( antiAA );

        this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), bloomStrength, bloomRadius, bloomThreshold );
        this.composer.addPass( this.bloomPass );

        this.createGUI(center, size, count);
    }

    createGUI(center: Vector3, size: number, count: number) {

        const options = {
            sunLightStrength: sunLightStrength,
            sunLightDecay: sunLightDecay,
            alpha1: alpha1,
            alpha2: alpha2,
            beta1: beta1,
            beta2: beta2,
            threshold: bloomThreshold,
            strength: bloomStrength,
            radius:bloomRadius,
            bloomToggle: true
        }
        var _this = this;

        const gui = new GUI()
        const lightFolder = gui.addFolder('Lights')
        lightFolder.add(options, 'sunLightStrength', 0,200).onChange( function () {
            _this.sunLight.intensity = options.sunLightStrength;
        } );
        lightFolder.add(options, 'sunLightDecay', 0,10).onChange( function () {
            _this.sunLight.decay = options.sunLightDecay;
        } );
        lightFolder.open()
        const moonFolder = gui.addFolder('Moons')
        moonFolder.add(options, 'alpha1', -3,3).step(0.1).onChange( function () {
            _this.reBornMoons(count,center, size, options.alpha1,options.alpha2, options.beta1,options.beta2);
        } );
        moonFolder.add(options, 'alpha2', -3,3).step(0.1).onChange( function () {
            _this.reBornMoons(count,center, size, options.alpha1,options.alpha2, options.beta1,options.beta2);
        } );
        moonFolder.add(options, 'beta1', -3,3).step(0.1).onChange( function () {
            _this.reBornMoons(count,center, size, options.alpha1,options.alpha2, options.beta1,options.beta2);
        } );
        moonFolder.add(options, 'beta2', -3,3).step(0.1).onChange( function () {
            _this.reBornMoons(count,center, size, options.alpha1,options.alpha2, options.beta1,options.beta2);
        } );
        moonFolder.open();
        const bloomFolder = gui.addFolder('Bloom')
        bloomFolder.add(options, 'threshold', 0,1).step(0.1).onChange( function ( value ) {

            _this.bloomPass.threshold = Number( value );

        } );
        bloomFolder.add(options, 'strength', 0,10).step(0.1).onChange( function ( value ) {

            _this.bloomPass.strength = Number( value );

        } );
        bloomFolder.add(options, 'radius', 0,10).step(0.1).onChange( function ( value ) {

            _this.bloomPass.radius = Number( value );

        } );
        bloomFolder.add( options, 'bloomToggle', true ).onChange( function ( value ) {

            _this.bloomPass.enabled=value;
        } );
        bloomFolder.open();
    }

    public reBornMoons(count: number, center: THREE.Vector3, size: number, alphaRot1:number , alphaRot2:number , betaRot1:number, betaRot2:number ) {

        this.moonSpeeds = [];
        this.moonPivots= [];
        this.moons= [];
        this.solarSystem.clear();
        this.orbiterPivots.forEach(orb=>this.solarSystem.add(orb));
        

        this.bornMoons(count, center, size,alphaRot1,alphaRot2,alphaDist);
        this.bornMoons(count, center, size,betaRot1,betaRot2,betaDist);
    }

    public bornMoons(count: number, center: THREE.Vector3, size: number, alphaRot:number , betaRot:number, distance: number ) {

        let geometry: ConvexGeometry;
        let material: Material;

        for (let i = 0; i < count / 10; i++) {

            geometry = this.generateGeometry(size / 15);

            const stoneTexture = new THREE.TextureLoader().load('assets/moons/stoneTexture.jpg');
            stoneTexture.wrapS = THREE.MirroredRepeatWrapping;
            stoneTexture.wrapT = THREE.MirroredRepeatWrapping;
            const stoneNormalMap = new THREE.TextureLoader().load('assets/moons/stoneNormalMap.jpg');
            material = new THREE.MeshStandardMaterial({
                map: stoneTexture,
                normalMap:stoneNormalMap
            });
            geometry.computeBoundingBox();
            if (geometry.boundingBox) {
                let bboxSize = new Vector3();
                geometry.boundingBox.getSize(bboxSize);
                let uvMapSize = Math.min(bboxSize.x, bboxSize.y, bboxSize.z);

                let boxGeometry = new THREE.BoxBufferGeometry(uvMapSize, uvMapSize, uvMapSize);
                let cube = new THREE.Mesh(boxGeometry, material);

                //calculate UV coordinates, if uv attribute is not present, it will be added
                UTILS.applyBoxUV(geometry, cube.matrix.invert(), uvMapSize);

            }
            //let three.js know
            geometry.attributes.uv.needsUpdate = true;
            const moon = new THREE.Mesh(geometry, material)

            const pivot = new Object3D();
            pivot.position.copy(center);

            //attach moon to pivot to be able to rotate mesh around pivot
            pivot.add(moon);

            pivot.rotateZ(alphaRot)
            pivot.rotateX(betaRot)
            pivot.rotateY(Math.random() * Math.PI * 2);
            moon.position.x = size * distance;
            moon.position.y = (Math.random() - 0.5) * size * 0.75;

            this.moonSpeeds.push(Math.random() - 0.5);
            this.moonPivots.push(pivot);
            this.moons.push(moon);

            this.solarSystem.add(pivot);
        }
    }



    public generateGeometry(size: number): ConvexGeometry {

        const points: Vector3[] = [];
        const pointsNumber = 5 + Math.random() * 5
        for (let i = 0; i < pointsNumber; i++) {
            points.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
                .normalize()
                .multiplyScalar(size * (1 + Math.random())));
        }
        const geometry = new ConvexGeometry(points);

        return geometry;
    }

    private createLensflare(size: number): Lensflare {
        const textureLoader = new TextureLoader();
        //const textureFlare0 = textureLoader.load('assets/lensflare0.png');
        const textureFlare3 = textureLoader.load('assets/lensflare3.png');

        const lensflare = new Lensflare();
        //lensflare.addElement(new LensflareElement(textureFlare0, size / 10, 0, new THREE.Color(0xfe9b14)));
        lensflare.addElement(new LensflareElement(textureFlare3, 60, 1));
        lensflare.addElement(new LensflareElement(textureFlare3, 70, 1.4));
        lensflare.addElement(new LensflareElement(textureFlare3, 120, 1.6));
        lensflare.addElement(new LensflareElement(textureFlare3, 70, 2));

        return lensflare;
    }

    private bornOrbiters(count: number, center: THREE.Vector3, size: number) {

        const geometry = new SphereGeometry(0.2, 32, 16);
        const material = new MeshToonMaterial({ color: 0xfedd1f });
        const radius = size /2;

        for (let i = 0; i < count; i++) {

            const mesh = new Mesh(geometry, material);
            //const meshLight = new PointLight( 0xfedd1f, 0.05 );
            //mesh.add(meshLight);
            const pivot = new Object3D();
            pivot.position.copy(center);

            //attach mesh to pivot to be able to rotate mesh around pivot
            pivot.add(mesh);

            pivot.rotateZ(Math.random() * Math.PI);
            pivot.rotateY(-Math.random() * Math.PI);

            const orbitLevel = Math.random();
            if (orbitLevel > 0.5) {
                mesh.position.x = this.gaussianRandom(0, radius * 0.2);

            } else if (orbitLevel < 0.5 && orbitLevel > 0.1) {

                mesh.position.x = this.gaussianRandom(radius * 0.2, radius * 0.7);
            }
            else {
                mesh.position.x = this.gaussianRandom(radius * 0.7, radius);
            }

            mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 5 + 1;

            //mesh.visible = false;

            this.orbiterPivots.push(pivot);

            this.orbiterSpeeds.push(Math.random() * size / (Math.abs(mesh.position.x) + 0.0001) + 0.3);
            this.orbiters.push(mesh);

            this.solarSystem.add(pivot);
        }
    }

    private gaussianRand(): number {
        var rand = 0;
        const factor = 4;
        for (var i = 0; i < factor; i += 1) {
            rand += Math.random();
        }

        return rand / factor;
    }

    private gaussianRandom(start: number, end: number): number {
        return Math.floor(start + this.gaussianRand() * (end - start + 1));
    }

    public addToScene(scene: Scene) {
        this.solarSystem.visible = false;
        scene.add(this.solarSystem);
        scene.add(this.sunLight);
        this.sunLight.add(this.lensflare);
    }

    public renderSolarSystem() {
        if (this.solarSystem.visible) {

            this.sunLight

            //const timer = 0.0001 * Date.now();
            for (let i = 0, il = this.orbiterPivots.length; i < il; i++) {
                const pivot = this.orbiterPivots[i];
                pivot.rotateY(this.orbiterSpeeds[i] * 0.015);
                pivot.rotateOnWorldAxis(new Vector3(0, 0, 1), 0.01);
                pivot.rotateOnWorldAxis(new Vector3(1, 0, 0), 0.005);
            }

            for (let i = 0, il = this.moonPivots.length; i < il; i++) {
                this.moonPivots[i].rotateY(0.001);
                if (i <= this.moons.length) {
                    const moon = this.moons[i];
                    moon.rotateX(this.moonSpeeds[i]*0.01);
                    moon.rotateY(this.moonSpeeds[i]*0.01);
                    moon.rotateZ(this.moonSpeeds[i]*0.01);
                }
            }
        }
        this.composer.render();
    }

    public toggleSolarSystem() {
        this.solarSystem.visible = !this.solarSystem.visible;
    }
}


