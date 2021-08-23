import * as THREE from 'three';
import { Box3, BufferGeometry, DodecahedronGeometry, Group, Light, LineSegments, Material, Matrix4, Mesh, MeshToonMaterial, Object3D, PointLight, Quaternion, Scene, SphereGeometry, TextureLoader, Vector3 } from "three";
// @ts-ignore
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
// @ts-ignore
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';


enum MoonOrbits {
    First,
    Second
}

export class SolarSystem {

    private solarSystem: Group;
    private orbiters: Mesh[] = [];
    private orbiterPivots: Object3D[] = [];
    private orbiterSpeeds: number[] = [];

    private moons: Mesh[] = [];
    private moonPivots: Object3D[] = [];
    private moonSpeeds: number[] = [];
    private moonAxis: number[] = [];

    //private sunMesh: Mesh;
    private sunLight: PointLight;
    private sunLightStrength: number = 100;
    private sunLightDecay: number = 3;
    visible: Boolean = false;
    private lensflare: Lensflare;

    public constructor(center: Vector3, size: number, count: number) {

        this.solarSystem = new Group();

        this.bornOrbiters(count, center, size);

        this.sunLight = new PointLight(0xfe9b14, this.sunLightStrength, size*3, this.sunLightDecay);
        this.sunLight.position.copy(center);

        this.lensflare = this.createLensflare(size);

        this.bornMoons(count, center, size,1.2,0);

        this.createGUI(center, size, count);
    }

    createGUI(center: Vector3, size: number, count: number) {

        const options = {
            sunLightStrength: 100,
            sunLightDecay: 2,
            pivot1: 0,
            pivot2: 0
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
        moonFolder.add(options, 'pivot1', -3,3).step(0.1).onChange( function () {
            _this.reBornMoons(count,center, size, options.pivot1,options.pivot2);
        } );
        moonFolder.add(options, 'pivot2', -3,3).step(0.1).onChange( function () {
            _this.reBornMoons(count,center, size, options.pivot1,options.pivot2);
        } );
        moonFolder.open();


        this.moonPivots

    }

    public reBornMoons(count: number, center: THREE.Vector3, size: number, alphaRot:number , betaRot:number ) {

        this.moonAxis = [];
        this.moonSpeeds = [];
        this.moonPivots= [];
        this.moons= [];
        this.solarSystem.clear();

        this.bornMoons(count, center, size, alphaRot , betaRot )
    }

    public bornMoons(count: number, center: THREE.Vector3, size: number, alphaRot:number , betaRot:number ) {

        let geometry: ConvexGeometry;
        let material: Material;
        let axis: number = 0;

        for (let i = 0; i < count / 10; i++) {

            geometry = this.generateGeometry(size / 10);

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
                applyBoxUV(geometry, cube.matrix.invert(), uvMapSize);

            }
            //let three.js know
            geometry.attributes.uv.needsUpdate = true;
            const moon = new THREE.Mesh(geometry, material)

            const pivot = new Object3D();
            pivot.position.copy(center);

            //attach moon to pivot to be able to rotate mesh around pivot
            pivot.add(moon);
            axis = i % 10;

            if (axis < 5) {
                pivot.rotateZ(alphaRot)
                pivot.rotateX(0.2)
                pivot.rotateY(Math.random() * Math.PI * 2);
                moon.position.x = size * 2;
                moon.position.y = (Math.random() - 0.5) * size / 2;

            } else {
                pivot.rotateZ(betaRot)
                pivot.rotateX(0.9)
                pivot.rotateZ(Math.random() * Math.PI * 2)
                moon.position.x = size * 2.3;
                moon.position.z = (Math.random() - 0.5) * size / 2;
            }
            this.moonAxis.push(axis);

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
        const radius = size / 2;

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
                if (this.moonAxis[i] < 5)
                    this.moonPivots[i].rotateY(0.001);
                else
                    this.moonPivots[i].rotateZ(0.001);
                if (i <= this.moons.length) {
                    const moon = this.moons[i];
                    moon.rotateX(this.moonSpeeds[i]*0.005);
                    moon.rotateY(this.moonSpeeds[i]*0.005);
                    moon.rotateZ(this.moonSpeeds[i]*0.005);
                }
                //pivot.rotateOnWorldAxis(new Vector3(0, 0, 1), 0.01);
                //pivot.rotateOnWorldAxis(new Vector3(1, 0, 0), 0.005);
            }
        }
    }

    public toggleSolarSystem() {
        this.solarSystem.visible = !this.solarSystem.visible;
    }
}


function _applyBoxUV(geom: BufferGeometry, transformMatrix: Matrix4, bbox: Box3, bbox_max_size: number) {

    let coords: any[] = [];
    coords.length = 2 * geom.attributes.position.array.length / 3;

    // geom.removeAttribute('uv');
    if (geom.attributes.uv === undefined) {
        geom.addAttribute('uv', new THREE.Float32BufferAttribute(coords, 2));
    }

    //maps 3 verts of 1 face on the better side of the cube
    //side of the cube can be XY, XZ or YZ
    let makeUVs = function (v0: Vector3, v1: Vector3, v2: Vector3) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        //get normal of the face, to know into which cube side it maps better
        let n = new THREE.Vector3();
        n.crossVectors(v1.clone().sub(v0), v1.clone().sub(v2)).normalize();

        n.x = Math.abs(n.x);
        n.y = Math.abs(n.y);
        n.z = Math.abs(n.z);

        let uv0 = new THREE.Vector2();
        let uv1 = new THREE.Vector2();
        let uv2 = new THREE.Vector2();
        // xz mapping
        if (n.y > n.x && n.y > n.z) {
            uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
            uv0.y = (bbox.max.z - v0.z) / bbox_max_size;

            uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
            uv1.y = (bbox.max.z - v1.z) / bbox_max_size;

            uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
            uv2.y = (bbox.max.z - v2.z) / bbox_max_size;
        } else
            if (n.x > n.y && n.x > n.z) {
                uv0.x = (v0.z - bbox.min.z) / bbox_max_size;
                uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

                uv1.x = (v1.z - bbox.min.z) / bbox_max_size;
                uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

                uv2.x = (v2.z - bbox.min.z) / bbox_max_size;
                uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
            } else
                if (n.z > n.y && n.z > n.x) {
                    uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
                    uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

                    uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
                    uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

                    uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
                    uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
                }

        return {
            uv0: uv0,
            uv1: uv1,
            uv2: uv2
        };
    };

    if (geom.index) { // is it indexed buffer geometry?
        for (let vi = 0; vi < geom.index.array.length; vi += 3) {
            let idx0 = geom.index.array[vi];
            let idx1 = geom.index.array[vi + 1];
            let idx2 = geom.index.array[vi + 2];

            let vx0 = geom.attributes.position.array[3 * idx0];
            let vy0 = geom.attributes.position.array[3 * idx0 + 1];
            let vz0 = geom.attributes.position.array[3 * idx0 + 2];

            let vx1 = geom.attributes.position.array[3 * idx1];
            let vy1 = geom.attributes.position.array[3 * idx1 + 1];
            let vz1 = geom.attributes.position.array[3 * idx1 + 2];

            let vx2 = geom.attributes.position.array[3 * idx2];
            let vy2 = geom.attributes.position.array[3 * idx2 + 1];
            let vz2 = geom.attributes.position.array[3 * idx2 + 2];

            let v0 = new THREE.Vector3(vx0, vy0, vz0);
            let v1 = new THREE.Vector3(vx1, vy1, vz1);
            let v2 = new THREE.Vector3(vx2, vy2, vz2);

            let uvs = makeUVs(v0, v1, v2);

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }
    } else {
        for (let vi = 0; vi < geom.attributes.position.array.length; vi += 9) {
            let vx0 = geom.attributes.position.array[vi];
            let vy0 = geom.attributes.position.array[vi + 1];
            let vz0 = geom.attributes.position.array[vi + 2];

            let vx1 = geom.attributes.position.array[vi + 3];
            let vy1 = geom.attributes.position.array[vi + 4];
            let vz1 = geom.attributes.position.array[vi + 5];

            let vx2 = geom.attributes.position.array[vi + 6];
            let vy2 = geom.attributes.position.array[vi + 7];
            let vz2 = geom.attributes.position.array[vi + 8];

            let v0 = new THREE.Vector3(vx0, vy0, vz0);
            let v1 = new THREE.Vector3(vx1, vy1, vz1);
            let v2 = new THREE.Vector3(vx2, vy2, vz2);

            let uvs = makeUVs(v0, v1, v2);

            let idx0 = vi / 3;
            let idx1 = idx0 + 1;
            let idx2 = idx0 + 2;

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }
    }

    geom.setAttribute("uv",new THREE.Float32BufferAttribute(coords,2));
}

function applyBoxUV(bufferGeometry: BufferGeometry, transformMatrix: THREE.Matrix4, boxSize: number) {

    if (transformMatrix === undefined) {
        transformMatrix = new THREE.Matrix4();
    }

    if (boxSize === undefined) {
        let geom = bufferGeometry;
        geom.computeBoundingBox();
        let bbox = geom.boundingBox;
        if (bbox) {
            let bbox_size_x = bbox.max.x - bbox.min.x;
            let bbox_size_z = bbox.max.z - bbox.min.z;
            let bbox_size_y = bbox.max.y - bbox.min.y;

            boxSize = Math.max(bbox_size_x, bbox_size_y, bbox_size_z);
        }
    }

    let uvBbox = new THREE.Box3(new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));

    _applyBoxUV(bufferGeometry, transformMatrix, uvBbox, boxSize);

}