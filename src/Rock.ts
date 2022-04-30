import {AudioListener, Audio, AdditiveBlending, BufferAttribute, BufferGeometry, Camera, Clock, Color, FrontSide, IUniform, LoadingManager, Matrix4, Mesh, MirroredRepeatWrapping, Scene, Shader, ShaderMaterial, SphereBufferGeometry, Sprite, SpriteMaterial, TextureLoader, Vector2, Vector3, AudioLoader } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
// @ts-ignore 
import { DRACOLoader } from './libs/loaders/DRACOLoader.js';
// @ts-ignore 
import { GLTFLoader } from './libs/loaders/GLTFLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

// @ts-ignore  
import lavaFragmentShader from './utils/shaders/lavaFragment.glsl';
// @ts-ignore
import lavaVertexShader from './utils/shaders/lavaVertexShader.glsl';

// @ts-ignore 
import explosionFragment from "./utils/shaders/explosionFragment.glsl";
// @ts-ignore 
import explosionLavaVertex from "./utils/shaders/explosionLavaVertex.glsl";
import GUI from 'lil-gui';


enum Anim {
    SUN,
    CAM,
    EXPL,
    HALO,
    HUE,
    _count
}


export class Rock {

    univerSize: number;
    clock: Clock;
    tuniform: { [uniform: string]: IUniform<any>; };
    haloSprite!: Sprite;
    coronaSprite!: Sprite;
    loader: any;
    matInside!: ShaderMaterial;
    scene: Scene;
    matSurface!: ShaderMaterial;
    loadingManager: LoadingManager;
    progress = 0;
    surfaceColor: Color;
    insideColor: Color;
    mesh: Mesh<SphereBufferGeometry, ShaderMaterial>;
    tween: TWEEN.Tween<Record<string, any>>[][] = [];
    tweenEnded: Boolean[] = [];
    camera: Camera;
    haloColor!: { h: number; s: number; l: number; };
    haloStartScale!: number;
    cameraStart!: Vector3;
    coronaStartScale!: number;
    cameraSpeed: number = 0;
    meshInside!: Mesh<BufferGeometry, ShaderMaterial>;
    meshSurface!: Mesh<BufferGeometry, ShaderMaterial>;
    listener: AudioListener;
    sounds: Map<string, Audio> = new Map();


    constructor(size: number, scene: Scene, loadingManager: LoadingManager, camera:Camera) {
        this.univerSize = size/1.2;
        this.loadingManager = loadingManager;
        this.scene = scene;
        const { uniform, mesh } = this.createRock();
        this.tuniform = uniform;
        this.mesh = mesh;
        this.clock = new Clock();
        this.surfaceColor = new Color(0xfedd1f);
        this.insideColor = new Color(0x666666);
        this.camera = camera;
        this.listener = new AudioListener();
        this.camera.add( this.listener );
        this.createHalo();
        this.importRock();
        this.loadSound(this.listener, 'sounds/lava.mp3');
        this.loadSound(this.listener, 'sounds/explosion.mp3');   
        this.loadSound(this.listener, 'sounds/explosion2.mp3');
        // this.createGUI();
    }


    createHalo() {

        const halo = new TextureLoader().load('../assets/rock/halo2.webp');
        const corona = new TextureLoader().load('../assets/rock/corona3.webp');
        const haloMat = new SpriteMaterial({
            map: halo,
            blending: AdditiveBlending,
            color: 0xfe9501,
            opacity: 0.6
        });

        const coronaMat = new SpriteMaterial({
            map: corona,
            blending: AdditiveBlending,
            color: 0xfecb01,
            opacity: 1
        });

        this.haloSprite = new Sprite(haloMat);
        this.coronaSprite = new Sprite(coronaMat);
        const scale = this.univerSize * 2;
        this.haloSprite.scale.set(scale, scale, 1)
        this.coronaSprite.scale.set(scale * 0.6, scale * 0.6, 1);

        // this.coronaSprite.position.set(-400,0,400);

    }

    importRock() {

        this.loader = new GLTFLoader(this.loadingManager).setPath("../assets/");
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/libs/draco/gltf/");

        this.loader.setDRACOLoader(dracoLoader);

        this.prepareMaterial();
        this.loadAndPrepareMeshes();
    }

    createRock() {

        const shader = Rock.lavaShader();

        const mat = new ShaderMaterial({
            uniforms: shader.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
        });

        const scale = this.univerSize / 11;
        const geo = new SphereBufferGeometry(scale, scale, 40, 40);

        const mesh = new Mesh(geo, mat);

        return { uniform: shader.uniforms, mesh: mesh }
    }



    prepareMaterial() {
        let that = this;

        const rock = new TextureLoader().load('../assets/moons/stoneTexture.webp');
        rock.wrapS = rock.wrapT = MirroredRepeatWrapping;

        const noise = new TextureLoader().load('../assets/noise1.png');

        const uniforms = {
            time: { type: "f", value: 0.0 },
            progress: { type: "f", value: 0.0 },
            inside: { type: "f", value: 0.0 },
            surfaceColor: { type: "v3", value: that.surfaceColor },
            insideColor: { type: "v3", value: that.insideColor },
            tRock: { value: rock },
            iNoise: { type: 't', value: noise },
            pixels: { type: "v2", value: new Vector2(window.innerWidth, window.innerHeight) },
            brightness: { type: "f", value: 1.0 },
            saturation: { type: "f", value: 1.0 },
            
        };
        const uniforms1 = {
            time: { type: "f", value: 0.0 },
            progress: { type: "f", value: 0.0 },
            inside: { type: "f", value: 0.0 },
            surfaceColor: { type: "v3", value: that.surfaceColor },
            insideColor: { type: "v3", value: that.insideColor },
            tRock: { value: rock },
            iNoise: { type: 't', value: noise },
            pixels: { type: "v2", value: new Vector2(window.innerWidth, window.innerHeight) },
            brightness: { type: "f", value: 1.0 },
            saturation: { type: "f", value: 1.0 },
        };

        this.matInside = new ShaderMaterial({
            extensions: {
                derivatives: true
            },
            side: FrontSide,
            uniforms: uniforms,
            vertexShader: explosionLavaVertex,
            fragmentShader: explosionFragment
        });

        this.matSurface = new ShaderMaterial({
            extensions: {
                derivatives: true
            },
            side: FrontSide,
            uniforms: uniforms1,
            vertexShader: explosionLavaVertex,
            fragmentShader: explosionFragment
        });

        // this.material1 = this.material.clone();
        this.matSurface.uniforms.inside.value = 1;
    }


    addToScene(scene: Scene) {
        this.mesh.rotateY(Math.PI / 4.2)
        scene.add(this.mesh);
        scene.add(this.coronaSprite);
        scene.add(this.haloSprite);


        const _this=this;
        let wait = setInterval(function() {
            if (_this.meshInside && _this.meshSurface) {
                clearInterval(wait);
                _this.scene.add(_this.meshInside);
                _this.scene.add(_this.meshSurface);
            }
        }, 500);
    }

    public toggleVisibility() {
        this.mesh.visible = !this.mesh.visible;
        if(this.meshInside){this.meshInside.visible = !this.meshInside.visible;}
        if(this.meshSurface){this.meshSurface.visible = !this.meshSurface.visible;}
        this.coronaSprite.visible = !this.coronaSprite.visible;
        this.haloSprite.visible = !this.haloSprite.visible;
    }



    t =     [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 13.5, 14.0, 14.21, 14.211, 14.35, 14.99, 15.0, 16.0, 17.0, 17.2, ];
    sunS =  [1.0, 1.0, 1.0, 1.0, 1.0, null,1.02,null,0.95,null,1.05, null, 0.95, null, null, 1.10, 0.8,   0.4,    null,  null,  null, null, 1.0,  4.0,  ];
    haloB = [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6,  0.62, 0.65, 0.70, null, 0.75, null,  0.80,   0.80,  0.80,  0.80, 0.85, 0.90, 1.0,  ];
    coreB = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1,  1.1,  1.15, 1.2,  null, 1.3,  null,  1.4,    1.5,   1.5,   1.5,  1.5,  1.5,  3.0,  ];
    coreS = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  1.0,  1.0,  0.95, null, 0.75, null,  0.35,   0.35,  0.35,  0.35, 0.35, 0.35, 0.3,  ];
    surfB = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1,  1.1,  1.15, 1.2,  null, 1.25, null,  1.3,    1.3,   1.3,   1.3,  1.35, 1.4,  1.4,  ];    
    coreH = [360, 360, 360, 360, 360, 360, 360, 360, 360, 360, 360,  360,  360,  360,  null, 360,  360,   209,    209,   209,   209,  209,  209,  209,  ];    
    explP = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  0.0,  0.0,  0.0,  null, 0.0,  null,  null,   0.2,   null,  null, null, 0.7,  2.0,  ];
    camR  = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,  0.1,  0.1,  0.1,  null, 0.1,  null,  null,   1.5,   null,  null, null, 1.5 , 0.0,  ];

    tweenGroup = new TWEEN.Group();

    static getPrevIdx(arr: any[], idx: number): number {
        let back = 1;
        while (idx - back >= 0 && idx - back < arr.length && arr[idx - back] == null) {
            back++;
        }
        return idx - back;
    }

    getTime(idx: number, prevIdx: number): number {
        return (this.t[idx] - this.t[prevIdx]) * 1000;
    }

    private isAnimationPlaying(){
        let isPlaying = false;
        this.tweenGroup.getAll().forEach(tween => {
            isPlaying = isPlaying || tween.isPlaying();
        });
        return isPlaying;
    }

    async startAnimation(){
        const _this=this;
        this.animateExplosion();
        return new Promise<void>(function (resolve) {
            let wait = setInterval(function() {
                if (!_this.isAnimationPlaying()) {
                    clearInterval(wait);
                    _this.audioFadeOut(_this.listener,1);
                    resolve();
                }
            }, 200);  
        });
    }

    private animateExplosion(startT: number = -1) {

        //save start values (for GUI restarts)
        if(startT==-1){
            startT=1;
            this.haloColor = { h: 0, s: 0, l: 0 };
            this.haloSprite.material.color.getHSL(this.haloColor);
            this.cameraStart = this.camera.position;
            this.coronaStartScale = this.coronaSprite.scale.x;
            this.haloStartScale = this.haloSprite.scale.x;
            this.tuniform.iHue.value = 360;
        }

        this.tween = [];
        

        for (let t = 0; t < Anim._count; t++) {
            this.tween[t] = new Array<TWEEN.Tween<Record<string, any>>>()
            this.tweenEnded[t] = false;
        }

        for (let i = startT; i < this.t.length; i++) {

            if (this.sunS[i] != null) {
                const pI = Rock.getPrevIdx(this.sunS, i);
                const time = this.getTime(i, pI);
                this.tween[Anim.SUN].push(new TWEEN.Tween({ scale: this.sunS[pI] }, this.tweenGroup)
                    .to({ scale: this.sunS[i] }, time)
                    .onUpdate((tween) => {
                        this.tuniform.iScale.value = tween.scale;
                        this.coronaSprite.scale.set(this.coronaStartScale * tween.scale!, this.coronaStartScale * tween.scale!, 1);
                        this.haloSprite.scale.set(this.haloStartScale * tween.scale!, this.haloStartScale * tween.scale!, 1);
                    })
                    .easing(TWEEN.Easing.Sinusoidal.InOut));
            }

            //case if all frames set
            if (this.haloB[i] != null ) {
                console.assert(this.coreB[i] != null && this.surfB[i] != null && this.coreS[i] != null, "synchronized parameter not set at i="+i);
                
                const pI = Rock.getPrevIdx(this.haloB, i);
                const time = this.getTime(i, pI);
                this.tween[Anim.HALO].push(new TWEEN.Tween({ 
                    haloB: this.haloB[pI], 
                    coreB: this.coreB[pI], 
                    surfB: this.surfB[pI], 
                    coreS: this.coreS[pI]
                }, this.tweenGroup)
                    .to({ haloB: this.haloB[i], lavaB: this.coreB[i], surfB: this.surfB[i], coreS: this.coreS[i] }, time)
                    .onUpdate((tween) => {
                        this.haloSprite.material.color.setHSL(this.haloColor.h, this.haloColor.s, tween.haloB!);
                        this.coronaSprite.material.color.setHSL(this.haloColor.h, this.haloColor.s, tween.haloB!);
                        this.tuniform.iBrightness.value = tween.coreB;
                        this.tuniform.iSaturation.value = tween.coreS;
                        this.matSurface.uniforms.brightness.value = tween.surfB;
                    })
                    .easing(TWEEN.Easing.Linear.None));
            }

            if (this.coreH[i] != null) {
                const pI = Rock.getPrevIdx(this.coreH, i);
                const time = this.getTime(i, pI);
                this.tween[Anim.HUE].push(new TWEEN.Tween({ 
                    coreH: this.coreH[pI] 
                }, this.tweenGroup)                    
                    .to({ coreH: this.coreH[i]}, time)
                    .onStart(   (tween)=>{this.tuniform.iHue.value =  tween.coreH;})
                    .onComplete((tween)=>{this.tuniform.iHue.value =  tween.coreH;})
                    );
            }

            if (this.explP[i] != null && this.camR[i] != null) {
                const pI = Rock.getPrevIdx(this.explP, i);
                const time = this.getTime(i, pI);
                this.tween[Anim.EXPL].push(new TWEEN.Tween({ explP: this.explP[pI],camR: this.camR[pI] }, this.tweenGroup)
                    .to({ explP: this.explP[i],camR: this.camR[i] }, time)
                    .onUpdate((tween) => {
                        this.matInside.uniforms.progress.value = this.matSurface.uniforms.progress.value = tween.explP;
                        this.cameraSpeed = tween.camR!;
                    })
                    .easing(TWEEN.Easing.Sinusoidal.InOut));
            }
        }

        //chain all types 
        for (let t = 0; t < Anim._count; t++) {
            for (let index = 0; index < this.tween[t].length - 1; index++) {
                this.tween[t][index].chain(this.tween[t][index + 1]);
            }
        }

        //start all types
        for (let t = 0; t < Anim._count; t++) {
            if (this.tween[t][0]){
                this.tween[t][0].start();
            }  
        }        

        this.playSound('sounds/lava.mp3',0,6,8,0.3,17);
        this.playSound('sounds/explosion.mp3',13.2,1.3,1.8,0.7,undefined);   
        this.playSound('sounds/explosion2.mp3',16.5,0,1,1,2);
    }

    playSound(soundName: string, delay:number,offset: number, fadeInTime: number, rate:number, duration:number|undefined){

        const _this=this;
        const sound = this.sounds.get(soundName);
        if(sound){
            sound.duration = duration;
            sound.offset  = offset;
            sound.playbackRate = rate;
            sound.gain.gain.value = 0;
            setTimeout(function () { sound.play(); _this.audioFadeIn(sound,fadeInTime)}, delay*1000);     
        }       
        
    }

    loadSound(listener:AudioListener,soundName: string){
        const sound = new Audio( listener );
        const audioLoader = new AudioLoader(this.loadingManager);
        audioLoader.load(soundName, function( buffer ) {
            sound.setBuffer( buffer );
            sound.gain.gain.value = 0;        
        });
        this.sounds.set(soundName,sound);
    }

    audioFadeIn(sound:Audio, duration:number){        

        new TWEEN.Tween(sound.gain.gain)
        .to({value: 1},duration*1000)
        .start()
    }

    audioFadeOut(listener:any, duration:number){        

        new TWEEN.Tween(listener.gain.gain)
        .to({value: 0},duration*1000)
        .start()
    }


    time = 0;
    matrix = new Matrix4();
    render() {

        this.time += 0.05;
        this.matInside.uniforms.time.value = this.time;
        this.matSurface.uniforms.time.value = this.time;

        this.tuniform.iTime.value = this.time * 0.2;
        this.coronaSprite.material.rotation += 0.001;
        this.haloSprite.material.rotation -= 0.001;
        this.tweenGroup.update();
        this.matrix.makeRotationY( this.cameraSpeed/100);
        this.camera.position.applyMatrix4(this.matrix);
 
    }

    createGUI() {

        const _this = this;

        const gui = new GUI({ width: 50 })
        const buttons: any = { button: "T1" };

        for (let i = 1; i < this.t.length; i++) {

            buttons['T' + (i - 1)] = function () {
                _this.tweenGroup.removeAll();
                _this.animateExplosion(_this.t[i]);
            };
            gui.add(buttons, 'T' + (i - 1));

        }

    }

    //////////////////////////////////////////////////////////////////////////
    // CODE BELOW is adaptation of Yuri Artiukh algorithm:
    // https://github.com/akella/ExplodingObjects
    // License: https://github.com/akella/ExplodingObjects#license
    //////////////////////////////////////////////////////////////////////////
    loadAndPrepareMeshes() {
        const that = this;

        this.loader.load(
            // "/glb/ico-more.glb",
            "/glb/sphere.glb",
            function (gltf: any) {
                let voron: any[] = [];
                let geoms: any[] = [];
                let geoms1: any[] = [];
                gltf.scene.traverse(function (child: any) {

                    if (child.name === "Voronoi_Fracture") {
                        if (child.children[0].children.length > 2) {
                            child.children.forEach((f: any) => {
                                f.children.forEach((m: any) => {
                                    voron.push(m.clone());
                                });
                            });
                        } else {
                            child.children.forEach((m: any) => {
                                voron.push(m.clone());
                            });
                        }
                    }
                });

                let j = 0;
                voron = voron.filter(v => {
                    if (v.isMesh) return false;
                    else {
                        j++;
                        let vtempo = that.processSurface(v, j);
                        geoms.push(vtempo.surface);
                        geoms1.push(vtempo.volume);

                        return true;
                    }
                });

                let s = BufferGeometryUtils.mergeBufferGeometries(geoms, false);

                that.meshInside = new Mesh(s, that.matInside);
                that.meshInside.frustumCulled = false;

                let s1 = BufferGeometryUtils.mergeBufferGeometries(geoms1, false);
                that.meshSurface = new Mesh(s1, that.matSurface);
                that.meshSurface.frustumCulled = false;

                const scale = that.univerSize / 14;
                that.meshInside.scale.set(scale, scale, scale);
                that.meshSurface.scale.set(scale, scale, scale);

            },
            undefined,
            function (e: any) {
                console.error(e);
            }
        );
    }

    processSurface(v: any, j: any) {
        let c = v.position;
        let vtemp, vtemp1;
        vtemp = v.children[0].geometry.clone();
        // vtemp = vtemp.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
        vtemp = vtemp.applyMatrix4(new Matrix4().makeTranslation(c.x, c.y, c.z));
        vtemp1 = v.children[1].geometry;
        // vtemp1 = vtemp1.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
        vtemp1 = vtemp1.clone().applyMatrix4(new Matrix4().makeTranslation(c.x, c.y, c.z));

        let len = v.children[0].geometry.attributes.position.array.length / 3;
        let len1 = v.children[1].geometry.attributes.position.array.length / 3;
        //  id
        let offset = new Array(len).fill(j / 500);
        vtemp.setAttribute(
            "offset",
            new BufferAttribute(new Float32Array(offset), 1)
        );

        let offset1 = new Array(len1).fill(j / 500);
        vtemp1.setAttribute(
            "offset",
            new BufferAttribute(new Float32Array(offset1), 1)
        );

        // axis
        let axis = getRandomAxis();
        let axes = new Array(len * 3).fill(0);
        let axes1 = new Array(len1 * 3).fill(0);
        for (let i = 0; i < len * 3; i = i + 3) {
            axes[i] = axis.x;
            axes[i + 1] = axis.y;
            axes[i + 2] = axis.z;
        }
        vtemp.setAttribute(
            "axis",
            new BufferAttribute(new Float32Array(axes), 3)
        );
        for (let i = 0; i < len1 * 3; i = i + 3) {
            axes1[i] = axis.x;
            axes1[i + 1] = axis.y;
            axes1[i + 2] = axis.z;
        }
        vtemp1.setAttribute(
            "axis",
            new BufferAttribute(new Float32Array(axes1), 3)
        );

        let centroidVector = getCentroid(vtemp);
        let centroid = new Array(len * 3).fill(0);
        let centroid1 = new Array(len1 * 3).fill(0);
        for (let i = 0; i < len * 3; i = i + 3) {
            centroid[i] = centroidVector.x;
            centroid[i + 1] = centroidVector.y;
            centroid[i + 2] = centroidVector.z;
        }
        for (let i = 0; i < len1 * 3; i = i + 3) {
            centroid1[i] = centroidVector.x;
            centroid1[i + 1] = centroidVector.y;
            centroid1[i + 2] = centroidVector.z;
        }
        vtemp.setAttribute(
            "centroid1",
            new BufferAttribute(new Float32Array(centroid), 3)
        );
        vtemp1.setAttribute(
            "centroid1",
            new BufferAttribute(new Float32Array(centroid1), 3)
        );

        return { surface: vtemp, volume: vtemp1 };
    }

    static lavaShader(): Shader {
        const noise = new TextureLoader().load('../assets/noise1.png');
        const tuniform = {
            iTime: { type: 'f', value: 0.0 },
            iNoise: { type: 't', value: noise },
            iScale: { type: 'f', value: 1.0 },
            iBrightness: { type: "f", value: 1.0 },
            iSaturation: { type: "f", value: -1.0 },
            iHue: { type: "f", value: -1.0 },
        };

        tuniform.iNoise.value.wrapS = tuniform.iNoise.value.wrapT = MirroredRepeatWrapping;

        const shader: Shader = {
            uniforms: tuniform,
            vertexShader: lavaVertexShader,
            fragmentShader: lavaFragmentShader
        };

        return shader;
    }
}

function getRandomAxis() {
    return new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
    ).normalize();
}

function getCentroid(geometry: BufferGeometry) {
    let ar = geometry.attributes.position.array;
    let len = ar.length;
    let x = 0,
        y = 0,
        z = 0;
    for (let i = 0; i < len; i = i + 3) {
        x += ar[i];
        y += ar[i + 1];
        z += ar[i + 2];
    }
    return { x: (3 * x) / len, y: (3 * y) / len, z: (3 * z) / len };
}