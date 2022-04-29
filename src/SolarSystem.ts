
import { BoxBufferGeometry, Group, LoadingManager, Mesh, MeshStandardMaterial, MeshToonMaterial, Object3D, PointLight,AudioListener, PositionalAudio, RepeatWrapping, Scene, SphereBufferGeometry, Texture, TextureLoader, Vector3, AudioLoader } from "three";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { GUI } from 'lil-gui';
import * as UTILS from './utils/applyUV'
import { gaussianRandom } from './utils/math';
//import { vertexShader, fragmentShader } from "./utils/lavaShader";

const alpha1 = 0.3;
const alpha2 = 0.4;
const beta1 = 1.3;
const beta2 = -0.8;

const metalness = 0;
const roughness = 1;

const alphaDist = 1.2;
const betaDist = 1.4;

const sunLightStrength = 120;
const sunLightDecay = 6;


export interface DirectionAngles {
    alpha1: number,
    alpha2: number,
    beta1: number,
    beta2: number
}

interface Options {
    alpha1: number,
    alpha2: number,
    beta1: number,
    beta2: number,
    metalness: number,
    roughness: number
}

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
    // private lensflare: Lensflare;
    vector3: Vector3;

    //postprocessing
    bloomPassToggle: boolean = true;

    options: Options = {
        alpha1: alpha1,
        alpha2: alpha2,
        beta1: beta1,
        beta2: beta2,
        metalness: metalness,
        roughness: roughness
    }
    customUniforms!: {
        baseTexture: { type: string; value: Texture; };
        baseSpeed: { type: string; value: number; };
        noiseTexture: { type: string; value: Texture; };
        noiseScale: { type: string; value: number; };
        alpha: { type: string; value: number; };
        time: { type: string; value: number; };
    };
    loadingManager: LoadingManager;
    sound: PositionalAudio;

    public constructor(center: Vector3, size: number, count: number, initAngles: DirectionAngles, loadingManager: LoadingManager, listener: AudioListener) {

        this.solarSystem = new Group();
        this.vector3 = new Vector3();
        this.loadingManager=loadingManager;

        this.bornOrbiters(count, center, size);

        this.sunLight = new PointLight(0xfe9b14, this.sunLightStrength, size * 3, this.sunLightDecay);
        this.sunLight.position.copy(center);
        this.sunLight.castShadow = false;

        // this.lensflare = this.createLensflare(size);

        this.bornMoons(count, center, size, this.options, initAngles.alpha1, initAngles.alpha2, alphaDist);
        this.bornMoons(count * 1.2, center, size, this.options, initAngles.beta1, initAngles.beta2, betaDist);

        // create the PositionalAudio object (passing in the listener)
        this.sound = new PositionalAudio( listener );
        const _this=this;
        // load a sound and set it as the PositionalAudio object's buffer
        const audioLoader = new AudioLoader(this.loadingManager);
        audioLoader.load( 'sounds/sun.mp3', function( buffer ) {
            _this.sound.setBuffer( buffer );
            // sound.setRefDistance( size/10 );
            // sound.setRolloffFactor(size/750);
            // sound.setDistanceModel('linear');
            _this.sound.setLoop( true );
            _this.sound.setDistanceModel('exponential');
            _this.sound.setRefDistance( size*2.5 );
            _this.sound.setRolloffFactor(size/50);
        }); 

        this.sunLight.add( this.sound ); 

        //this.createGUI(center, size, count);
    }

    createGUI(center: Vector3, size: number, count: number) {


        const _this = this;
        let options: Options = {
            alpha1: alpha1,
            alpha2: alpha2,
            beta1: beta1,
            beta2: beta2,
            metalness: metalness,
            roughness: roughness
        }

        const gui = new GUI()
        const lightFolder = gui.addFolder('Lights')
        lightFolder.add(_this.sunLight, 'intensity', 0, 200);
        lightFolder.add(_this.sunLight, 'decay', 0, 10);
        lightFolder.open()
        const moonFolder = gui.addFolder('Moons')
        moonFolder.add(options, 'alpha1', -3, 3).step(0.1).onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        moonFolder.add(options, 'alpha2', -3, 3).step(0.1).onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        moonFolder.add(options, 'beta1', -3, 3).step(0.1).onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        moonFolder.add(options, 'beta2', -3, 3).step(0.1).onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        moonFolder.add(options, 'beta2', -3, 3).step(0.1).onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        moonFolder.add(options, 'roughness', 0, 1).step(0.1).onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        moonFolder.add(options, 'metalness', 0, 1).step(0.1).listen().onChange(function () {
            _this.reBornMoons(count, center, size, options);
        });
        var obj = {
            button: function () {
                options = _this.options;
                _this.reBornMoons(count, center, size, options);
            }
        };
        moonFolder.add(obj, 'button').name('Reset');
        moonFolder.open();
        // const bloomFolder = gui.addFolder('Bloom')
        // bloomFolder.add(_this.bloomPass, 'threshold', 0,1).step(0.1);
        // bloomFolder.add(_this.bloomPass, 'strength', 0,10).step(0.1);
        // bloomFolder.add(_this.bloomPass, 'radius', 0,10).step(0.1);
        // bloomFolder.add( _this.bloomPass, 'enabled', true );
        // bloomFolder.open();
        gui.close();
    }

    public reBornMoons(count: number, center: Vector3, size: number, options: Options) {

        this.moonSpeeds = [];
        this.moonPivots = [];
        this.moons = [];
        this.solarSystem.clear();
        this.orbiterPivots.forEach(orb => this.solarSystem.add(orb));


        this.bornMoons(count, center, size, options, options.alpha1, options.alpha2, alphaDist);
        this.bornMoons(count, center, size, options, options.beta1, options.beta2, betaDist);
    }

    public bornMoons(count: number, center: Vector3, size: number, options: Options, alphaRot: number, betaRot: number, distance: number) {

        let geometry: ConvexGeometry;

        const stoneTexture = new TextureLoader(this.loadingManager).load('assets/moons/stoneTexture.webp');
        stoneTexture.wrapS = RepeatWrapping;
        stoneTexture.wrapT = RepeatWrapping;
        const stoneNormalMap = new TextureLoader(this.loadingManager).load('assets/moons/stoneNormalMap.webp');
        const material = new MeshStandardMaterial({
            map: stoneTexture,
            normalMap: stoneNormalMap,
            roughness: options.roughness,
            metalness: options.metalness
        });



        // var noiseTexture = new TextureLoader().load('assets/moons/cloud.png' );
        // noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping; 

        // var lavaTexture = new TextureLoader().load('assets/moons/lava.jpg' );
        // lavaTexture.wrapS = lavaTexture.wrapT = RepeatWrapping; 

        // // use "this." to create global object
        // this.customUniforms = {
        //     baseTexture: 	{ type: "t", value: lavaTexture },
        //     baseSpeed: 		{ type: "f", value: 0.05 },
        //     noiseTexture: 	{ type: "t", value: noiseTexture },
        //     noiseScale:		{ type: "f", value: 0.5337 },
        //     alpha: 			{ type: "f", value: 1.0 },
        //     time: 			{ type: "f", value: 1.0 }
        // };

        // // create custom material from the shader code above
        // // that is within specially labeled script tags
        // var customMaterial = new ShaderMaterial( 
        // {
        //     uniforms: this.customUniforms,
        //     vertexShader,
        //     fragmentShader,
        // }   );

        for (let i = 0; i < count / 10; i++) {

            geometry = this.generateGeometry(size / 15);
            geometry.computeBoundingBox();
            if (geometry.boundingBox) {
                let bboxSize = new Vector3();
                geometry.boundingBox.getSize(bboxSize);
                let uvMapSize = Math.min(bboxSize.x, bboxSize.y, bboxSize.z);

                let boxGeometry = new BoxBufferGeometry(uvMapSize, uvMapSize, uvMapSize);
                let cube = new Mesh(boxGeometry, material);

                //calculate UV coordinates, if uv attribute is not present, it will be added
                UTILS.applyBoxUV(geometry, cube.matrix.invert(), uvMapSize);

            }
            //let js know
            geometry.attributes.uv.needsUpdate = true;
            const moon = new Mesh(geometry, material)

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
            points.push(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
                .normalize()
                .multiplyScalar(size * (1 + Math.random())));
        }
        const geometry = new ConvexGeometry(points);

        return geometry;
    }

    // Effect is not suitable for this solution
    // @ts-ignore
    private createLensflare(size: number): Lensflare {
        //const textureFlare0 = textureLoader.load('assets/lensflare0.webp');
        const textureFlare3 = new TextureLoader(this.loadingManager).load('assets/lensflare3.webp');

        const lensflare = new Lensflare();
        //lensflare.addElement(new LensflareElement(textureFlare0, size / 10, 0, new Color(0xfe9b14)));
        lensflare.addElement(new LensflareElement(textureFlare3, 60, 1));
        lensflare.addElement(new LensflareElement(textureFlare3, 70, 1.4));
        lensflare.addElement(new LensflareElement(textureFlare3, 120, 1.6));
        lensflare.addElement(new LensflareElement(textureFlare3, 70, 2));

        return lensflare;
    }

    private bornOrbiters(count: number, center: Vector3, size: number) {

        const geometry = new SphereBufferGeometry(size / 1000, 8, 5);
        const material = new MeshToonMaterial({ color: 0xfedd1f });
        let radius = size / 2;

        for (let i = 0; i < count; i++) {

            const mesh = new Mesh(geometry, material);
            const pivot = new Object3D();
            pivot.position.copy(center);

            //attach mesh to pivot to be able to rotate mesh around pivot
            pivot.add(mesh);

            pivot.rotateZ(Math.random() * Math.PI);
            pivot.rotateY(-Math.random() * Math.PI);

            const orbitLevel = Math.random();
            if (orbitLevel > 0.5) {
                mesh.position.x = gaussianRandom(0, radius * 0.2);

            } else if (orbitLevel < 0.5 && orbitLevel > 0.1) {

                mesh.position.x = gaussianRandom(radius * 0.2, radius * 0.7);
            }
            else {
                mesh.position.x = gaussianRandom(radius * 0.7, radius);
            }

            mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 10 + 2;

            this.orbiterPivots.push(pivot);

            this.orbiterSpeeds.push(Math.random() * size / (Math.abs(mesh.position.x) + 0.0001) + 0.3);
            this.orbiters.push(mesh);
            this.solarSystem.add(pivot);
        }
    }


    public addToScene(scene: Scene) {
        this.solarSystem.visible = false;
        scene.add(this.solarSystem);
        scene.add(this.sunLight);
        // this.sunLight.add(this.lensflare);
    }

    public render() {
        if (this.solarSystem.visible) {

            let pivot: Object3D;
            let moon: Mesh;

            for (let i = 0, il = this.orbiterPivots.length; i < il; i++) {
                pivot = this.orbiterPivots[i];
                pivot.rotateY(this.orbiterSpeeds[i] * 0.015);
                pivot.rotateOnWorldAxis(this.vector3.set(0, 0, 1), 0.01);
                pivot.rotateOnWorldAxis(this.vector3.set(1, 0, 0), 0.005);
            }

            for (let i = 0, il = this.moonPivots.length; i < il; i++) {
                this.moonPivots[i].rotateY(0.001);
                if (i <= this.moons.length) {
                    moon = this.moons[i];
                    moon.rotateX(this.moonSpeeds[i] * 0.01);
                    moon.rotateY(this.moonSpeeds[i] * 0.01);
                    moon.rotateZ(this.moonSpeeds[i] * 0.01);
                }
            }
        }
    }

    public toggleVisibility() {
        this.solarSystem.visible = !this.solarSystem.visible;
        if(this.solarSystem.visible){            
            this.sound.play();
        } else{
            this.sound.stop();
        }        
    }
}


