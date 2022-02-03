import { AdditiveBlending, BufferAttribute, BufferGeometry, Clock, Color, DoubleSide, IUniform, LoadingManager, Matrix4, Mesh, MirroredRepeatWrapping, Raycaster, Scene, Shader, ShaderMaterial, SphereBufferGeometry, Sprite, SpriteMaterial, TextureLoader, Vector2, Vector3 } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import {DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import {GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


// @ts-ignore  
import lavaFragmentShader from './utils/shaders/lavaFragmentShader.glsl';
// @ts-ignore
import lavaVertexShader from './utils/shaders/lavaVertexShader.glsl';

// @ts-ignore 
// import GLTFLoader from "./lib/gltfloader";
// @ts-ignore 
// import DRACOLoader from "./lib/draco";

// @ts-ignore 
import explosionFragment from "./utils/shaders/explosionFragment.glsl";
// @ts-ignore 
import explosionVertex from "./utils/shaders/explosionVertexIco.glsl";

export interface Options {
    surface: String;
    inside: String;
    background?: String;
};

function getRandomAxis() {
    return new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
    ).normalize();
}
const sign = function (n: number) {
    return n === 0 ? 1 : n / Math.abs(n);
};

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
    mesh!: Mesh<BufferGeometry, ShaderMaterial>;
    tuniform: { [uniform: string]: IUniform<any>; };
    haloSprite!: Sprite;
    coronaSprite!: Sprite;
    loader: any;
    inverted = false;
    material: any;
    scene: Scene;
    mesh1!: Mesh<any, any>;
    material1: any;
    textureCube: any;
    loadingManager: LoadingManager;
    settings: { progress: number } = {progress:0};
    surfaceColor: Color;
    insideColor: Color;

    constructor(size: number,scene:Scene, loadingManager: LoadingManager,options: Options) {
        this.univerSize = size;
        this.loadingManager=loadingManager;
        this.scene=scene;
        const { uniform, mesh } = this.createRock();
        this.tuniform = uniform;
        // this.mesh = mesh;
        this.clock = new Clock();
        this.surfaceColor = new Color(parseInt("0x" + options.surface));
        this.insideColor = new Color(parseInt("0x" + options.inside));
        this.createHalo();
        this.importRock();
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

        this.loader = new GLTFLoader(this.loadingManager).setPath("models/");
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('../node_modules/three/examples/js/libs/draco/gltf/');
        
        this.loader.setDRACOLoader(dracoLoader);

        this.prepareMaterial();
        this.loadAndPrepareMeshes();
    }



    loadAndPrepareMeshes() {
        const that = this;

        this.loader.load(
            "../assets/glb/ico-more.glb",
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

                        if (that.inverted) {
                            geoms1.push(vtempo.surface);
                            geoms.push(vtempo.volume);
                        } else {
                            geoms.push(vtempo.surface);
                            geoms1.push(vtempo.volume);
                        }

                        return true;
                    }
                });

                let s = BufferGeometryUtils.mergeBufferGeometries(geoms,false);

                that.mesh = new Mesh(s, that.material);

                let s1 = BufferGeometryUtils.mergeBufferGeometries(geoms1,false);
                that.mesh1 = new Mesh(s1, that.material1);

                const scale = that.univerSize/20;
                that.mesh.scale.set(scale,scale,scale);
                that.mesh1.scale.set(scale,scale,scale);
                
                that.scene.add(that.mesh)
                that.scene.add(that.mesh1)
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
        vtemp = vtemp.applyMatrix4(
            new Matrix4().makeTranslation(c.x, c.y, c.z)
        );
        vtemp1 = v.children[1].geometry;
        vtemp1 = vtemp1
            .clone()
            .applyMatrix4(new Matrix4().makeTranslation(c.x, c.y, c.z));

        let len = v.children[0].geometry.attributes.position.array.length / 3;
        let len1 = v.children[1].geometry.attributes.position.array.length / 3;
        //  id
        let offset = new Array(len).fill(j / 100);
        vtemp.setAttribute(
            "offset",
            new BufferAttribute(new Float32Array(offset), 1)
        );

        let offset1 = new Array(len1).fill(j / 100);
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
            "centroid",
            new BufferAttribute(new Float32Array(centroid), 3)
        );
        vtemp1.setAttribute(
            "centroid",
            new BufferAttribute(new Float32Array(centroid1), 3)
        );

        return { surface: vtemp, volume: vtemp1 };
    }

    onLoad() {
        throw new Error('Method not implemented.');
    }

    createRock() {

        const shader = Rock.lavaShader();

        const mat = new ShaderMaterial({
            uniforms: shader.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
        });

        const geo = new SphereBufferGeometry(600, 600, 40, 40);

        const mesh = new Mesh(geo, mat);

        return { uniform: shader.uniforms, mesh: mesh }
    }

    static lavaShader(): Shader {
        const noise = new TextureLoader().load('../assets/noise1.png');
        noise.repeat.set(2, 2);
        const tuniform = {
            iTime: { type: 'f', value: 0.1 },
            iDelta: { type: 'f', value: 100.0 },
            iChannel0: { type: 't', value: noise },
            iResolution: { type: "v2", value: new Vector2() }
        };

        tuniform.iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT = MirroredRepeatWrapping;
        tuniform.iResolution.value.x = 1; // window.innerWidth;
        tuniform.iResolution.value.y = 1; // window.innerHeight;

        const shader: Shader = {
            uniforms: tuniform,
            vertexShader: lavaVertexShader,
            fragmentShader: lavaFragmentShader
        };

        return shader;
    }

    prepareMaterial() {
        let that = this;
        const uniforms = {
            time: { type: "f", value: 0 },
            progress: { type: "f", value: 0 },
            inside: { type: "f", value: 0 },
            surfaceColor: { type: "v3", value: that.surfaceColor },
            insideColor: { type: "v3", value: that.insideColor },
            tCube: { value: that.textureCube },
            pixels: { type: "v2", value: new Vector2(window.innerWidth, window.innerHeight) },
            uvRate1: { value: new Vector2(1, 1) }
        };
        this.material = new ShaderMaterial({
            extensions: {
                // derivatives: "#extension GL_OES_standard_derivatives : enable"
                derivatives: true
            },
            side: DoubleSide,
            uniforms: uniforms,
            vertexShader: explosionVertex,
            fragmentShader: explosionFragment
        });

        this.material1 = this.material.clone();
        this.material1.uniforms.inside.value = 1;

    }

    settingsReset() {
        this.settings = {
          progress: 0
        };
      }

    addToScene(scene: Scene) {
        
        // scene.add(this.coronaSprite);
        // scene.add(this.haloSprite);
    }

    time = 0;
    mouseX = 0;
     ta = 0;

    render(targetMouseX: number) {

        this.mouseX += (targetMouseX - this.mouseX)*0.05;
        this.ta = Math.abs(this.mouseX);
        this.settings.progress = this.ta;
        this.scene.rotation.y = Math.PI/2 - this.ta*(2 - this.ta)*Math.PI * Math.sign(this.mouseX);
        this.scene.rotation.z = Math.PI/2 - this.ta*(2 - this.ta)*Math.PI * Math.sign(this.mouseX);

        this.time += 0.05;
        this.material.uniforms.progress.value = Math.abs(this.settings.progress);
        this.material1.uniforms.progress.value = Math.abs(this.settings.progress);
        this.tuniform.iTime.value += this.clock.getDelta();
        this.tuniform.iDelta.value += this.tuniform.iDelta.value < 500 ? 0.3 : 0.0;
        // console.log(this.tuniform.iDelta.value)
        this.coronaSprite.material.rotation += 0.001;
        this.coronaSprite.scale.addScalar(10 * Math.sin(this.time));

        this.haloSprite.material.rotation -= 0.001;
        this.haloSprite.scale.addScalar(100 * Math.cos(this.time));
    }

}