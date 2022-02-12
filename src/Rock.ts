import { AdditiveBlending, Box3, BufferAttribute, BufferGeometry, ClampToEdgeWrapping, Clock, Color, ColorRepresentation, CubeTextureLoader, DoubleSide, IUniform, LoadingManager, Matrix4, Mesh, MirroredRepeatWrapping, Raycaster, RepeatWrapping, Scene, Shader, ShaderMaterial, SphereBufferGeometry, Sprite, SpriteMaterial, TextureLoader, Vector2, Vector3, WrapAroundEnding } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import {DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import {GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


// @ts-ignore  
import lavaFragmentShader from './utils/shaders/lavaFragment.glsl';
// @ts-ignore
import lavaVertexShader from './utils/shaders/lavaVertexShader.glsl';

// @ts-ignore 
// import GLTFLoader from "./lib/gltfloader";
// @ts-ignore 
// import DRACOLoader from "./lib/draco";

// @ts-ignore 
import explosionFragment from "./utils/shaders/explosionFragment.glsl";
// @ts-ignore 
import explosionLavaVertex from "./utils/shaders/explosionLavaVertex.glsl";

export interface Options {
    surface: ColorRepresentation;
    inside: ColorRepresentation;
    background?: String;
};

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

export class Rock {

    univerSize: number;
    clock: Clock;
    tuniform: { [uniform: string]: IUniform<any>; };
    haloSprite!: Sprite;
    coronaSprite!: Sprite;
    loader: any;
    material!: ShaderMaterial;
    scene: Scene;
    material1!: ShaderMaterial;
    loadingManager: LoadingManager;
    progress=0;
    surfaceColor: Color;
    insideColor: Color;
    mesh: Mesh<SphereBufferGeometry, ShaderMaterial>;

    constructor(size: number,scene:Scene, loadingManager: LoadingManager,options: Options ) {
        this.univerSize = size;
        this.loadingManager=loadingManager;
        this.scene=scene;
        const { uniform, mesh } = this.createRock();
        this.tuniform = uniform;
        this.mesh = mesh;
        this.clock = new Clock();
        this.surfaceColor = new Color(options.surface);
        this.insideColor = new Color(options.inside);
        this.createHalo();
        this.importRock();
        console.log("test")
    }


    createHalo() {

        const halo = new TextureLoader().load('../assets/rock/halo2.png');
        const corona = new TextureLoader().load('../assets/rock/corona3.png');
        const alphaMap = new TextureLoader().load('../assets/rock/alpha.png');
        // alphaMap.repeat.set(0.5, 0.5);
        // alphaMap.offset.set(0.4,0.4);
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
        this.haloSprite.scale.set(10000, 10000, 1)
        this.coronaSprite.scale.set(8000, 8000, 1);

        // this.coronaSprite.position.set(-400,0,400);

    }

    importRock() {

        this.loader = new GLTFLoader(this.loadingManager).setPath("../assets/");
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('../node_modules/three/examples/js/libs/draco/gltf/');
        
        this.loader.setDRACOLoader(dracoLoader);

        this.prepareMaterial();
        this.loadAndPrepareMeshes();
    }



    loadAndPrepareMeshes() {
        const that = this;

        this.loader.load(
            // "/glb/ico-more.glb",
            "/glb/sphere.glb",            
            function (gltf: any) {
                let voron:any[] = [];
                let geoms: any[] = [];
                let geoms1: any[] = [];
                gltf.scene.traverse(function (child: any) {
                    
                    if (child.name === "Voronoi_Fracture") {
                        if (child.children[0].children.length > 2) {
                            child.children.forEach((f:any) => {
                                f.children.forEach((m:any) => {
                                    voron.push(m.clone());
                                });
                            });
                        } else {
                            child.children.forEach((m:any) => {
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

                let s = BufferGeometryUtils.mergeBufferGeometries(geoms,false);

                const meshInside = new Mesh(s, that.material);
                meshInside.frustumCulled = false;

                let s1 = BufferGeometryUtils.mergeBufferGeometries(geoms1,false);
                const meshSurface = new Mesh(s1, that.material1);
                meshSurface.frustumCulled = false;

                const scale = that.univerSize/9.5;
                meshInside.scale.set(scale,scale,scale);
                meshSurface.scale.set(scale,scale,scale);
                
                that.scene.add(meshInside)
                that.scene.add(meshSurface)
                // that.onLoad();
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
        noise.repeat.set(2, 2);
        const tuniform = {
            iTime: { type: 'f', value: 0.0 },
            iDelta: { type: 'f', value: 100.0 },
            iNoise: { type: 't', value: noise },
            iResolution: { type: "v2", value: new Vector2(1,1) }
        };

        tuniform.iNoise.value.wrapS = tuniform.iNoise.value.wrapT = MirroredRepeatWrapping;

        const shader: Shader = {
            uniforms: tuniform,
            vertexShader: lavaVertexShader,
            fragmentShader: lavaFragmentShader
        };

        return shader;
    }

    createRock() {

        const shader = Rock.lavaShader();

        const mat = new ShaderMaterial({
            uniforms: shader.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
        });

        const scale = this.univerSize/8;
        const geo = new SphereBufferGeometry(scale, scale, 40, 40);

        const mesh = new Mesh(geo, mat);

        return { uniform: shader.uniforms, mesh: mesh }
    }



    prepareMaterial() {
        let that = this;
        const rock = new TextureLoader().load('../assets/moons/stoneTexture.jpg');
        rock.wrapS = rock.wrapT = MirroredRepeatWrapping;

        const noise = new TextureLoader().load('../assets/noise1.png');
        noise.wrapS = noise.wrapT = MirroredRepeatWrapping;

        const uniforms = {
            time: { type: "f", value: 0.0 },
            progress: { type: "f", value: 0.0 },
            inside: { type: "f", value: 0.0 },
            surfaceColor: { type: "v3", value: that.surfaceColor },
            insideColor: { type: "v3", value: that.insideColor },
            tRock: { value: rock },
            iNoise: { type: 't', value: noise },
            pixels: { type: "v2", value: new Vector2(window.innerWidth, window.innerHeight)}
        };
        const uniforms1 = {
            time: { type: "f", value: 0.0 },
            progress: { type: "f", value: 0.0 },
            inside: { type: "f", value: 0.0 },
            surfaceColor: { type: "v3", value: that.surfaceColor },
            insideColor: { type: "v3", value: that.insideColor },
            tRock: { value: rock },
            iNoise: { type: 't', value: noise },
            pixels: { type: "v2", value: new Vector2(window.innerWidth, window.innerHeight)}
        };

        this.material = new ShaderMaterial({
            extensions: {
                derivatives: true
            },
            side: DoubleSide,
            uniforms: uniforms,
            vertexShader: explosionLavaVertex,
            fragmentShader: explosionFragment
        });

        this.material1 = new ShaderMaterial({
            extensions: {
                derivatives: true
            },
            side: DoubleSide,
            uniforms: uniforms1,
            vertexShader: explosionLavaVertex,
            fragmentShader: explosionFragment
        });

        // this.material1 = this.material.clone();
        this.material1.uniforms.inside.value = 1;
        

    }


    addToScene(scene: Scene) {
        scene.add(this.mesh);
        scene.add(this.coronaSprite);
        scene.add(this.haloSprite);
    }

    time = 0;
    mouseX = 0;

    render(targetMouseX: number) {

        this.mouseX += (targetMouseX - this.mouseX)*0.05;
        this.progress = Math.abs(this.mouseX);

        this.time += 0.05;
        this.material.uniforms.progress.value = Math.abs(this.progress);
        this.material1.uniforms.progress.value = Math.abs(this.progress);

        
        this.material.uniforms.time.value = this.time;
        this.material1.uniforms.time.value = this.time;

        // console.log(this.material1.uniforms.progress.value)
        
        this.tuniform.iTime.value += this.clock.getDelta();
        // this.tuniform.iDelta.value += this.tuniform.iDelta.value < 500 ? 0.3 : 0.0;
        // console.log(this.tuniform.iDelta.value)
        this.coronaSprite.material.rotation += 0.001;
        this.coronaSprite.scale.addScalar(10 * Math.sin(this.time));

        this.haloSprite.material.rotation -= 0.001;
        this.haloSprite.scale.addScalar(100 * Math.cos(this.time));
    }

}