import * as THREE from 'three';
import { DodecahedronGeometry, Group, Light, Material, Mesh, MeshToonMaterial, Object3D, PointLight, Scene, SphereGeometry, TextureLoader, Vector3 } from "three";
// @ts-ignore
import { Lensflare, LensflareElement } from './utils/LensFlare.js'
// @ts-ignore
import { ConvexGeometry } from './utils/ConvexGeometry.js'

export class SolarSystem {

    private solarSystem: Group;
    private orbiters: Mesh[] = [];
    private pivots: Object3D[] = [];
    private pivotSpeed: number[] = [];
    //private sunMesh: Mesh;
    private sunLight: Light;
    visible: Boolean = false;
    private lensflare: Lensflare;

    public constructor(center: Vector3, size: number, count: number) {

        this.solarSystem = new Group();

        this.bornOrbiters(count, center, size);

        this.sunLight = new PointLight(0xfe9b14, 200, size, 7);
        this.sunLight.position.copy(center);

        this.lensflare = this.createLensflare(size);

        this.bornMoons(count, center, size);
    }

    public bornMoons(count: number, center: THREE.Vector3, size: number) {

        let geometry: DodecahedronGeometry;
        let material: Material;
        const radius = size / 2;

        for (let i = 0; i < count / 40; i++) {
            const type = Math.random();
            geometry = this.generateGeometry(10);

            // if(type <= 0.2){
            //     geometry = new DodecahedronGeometry(1+Math.random()*size/20);
            // }else if(0.2 < type && type <= 0.4){
            //     geometry = new IcosahedronGeometry(1+Math.random()*size/20);
            // }else if(0.4 < type ) {
            //     geometry = this.generateGeometry();
            // }

            const finish = Math.random();
            if (finish <= 0.2) {
                //material =
            } else if (0.2 < finish && finish <= 0.4) {
            } else if (0.4 < finish && finish <= 0.6) {
            } else if (0.6 < finish && finish <= 0.8) {
            } else if (0.8 < finish) {
            }
        }
    }


    public generateGeometry(size: number): ConvexGeometry {

        const points: Vector3[] = [];
        const pointsNumber = 4 + Math.random() * 5
        for (let i = 0; i < pointsNumber; i++) {
            points.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
                .normalize()
                .multiplyScalar(size * (1 + Math.random())));
        }
        const geometry = new ConvexGeometry( points );

        return geometry;
    }

    private createLensflare(size: number): Lensflare {
        const textureLoader = new TextureLoader();
        const textureFlare0 = textureLoader.load('assets/lensflare0.png');
        const textureFlare3 = textureLoader.load('assets/lensflare3.png');

        const lensflare = new Lensflare();
        lensflare.addElement(new LensflareElement(textureFlare0, size / 10, 0, new THREE.Color(0xfe9b14)));
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

            mesh.visible = false;

            this.pivots.push(pivot);

            this.pivotSpeed.push(Math.random() * size / (Math.abs(mesh.position.x) + 0.0001) + 0.3);
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
        scene.add(this.solarSystem);
        scene.add(this.sunLight);
        this.sunLight.add(this.lensflare);
    }

    public renderSolarSystem() {
        if (this.visible) {
            //const timer = 0.0001 * Date.now();
            for (let i = 0, il = this.orbiters.length; i < il; i++) {
                const pivot = this.pivots[i];
                pivot.rotateY(this.pivotSpeed[i] * 0.015);
                pivot.rotateOnWorldAxis(new Vector3(0, 0, 1), 0.01);
                pivot.rotateOnWorldAxis(new Vector3(1, 0, 0), 0.005);
            }
        }
    }

    public toggleSolarSystem() {

        for (let i = 0, il = this.orbiters.length; i < il; i++) {
            this.orbiters[i].visible = !this.orbiters[i].visible;
        }
        this.visible = !this.visible;

    }
}
