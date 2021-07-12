import * as THREE from 'three';
import { Light, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, MeshToonMaterial, Object3D, PointLight, Scene, SphereGeometry, TextureLoader, Vector3 } from "three";
// @ts-ignore
import { Lensflare, LensflareElement } from './utils/LensFlare.js'

export class SolarSystem {

    private _meshes: Mesh[] = [];
    private pivots: Object3D[] = [];
    private pivotSpeed: number[] = [];
    public get meshes(): Mesh[] {
        return this._meshes;
    }
    public set meshes(value: Mesh[]) {
        this._meshes = value;
    }
    //private sunMesh: Mesh;
    private sunLight: Light;
    private center: Vector3;
    private size: number;
    visible: Boolean = false;
    private lensflare: Lensflare;

    public constructor(center: Vector3, size: number, count: number) {

        const geometry = new SphereGeometry(0.2, 32, 16);
        const material = new MeshToonMaterial({ color: 0xfedd1f });
        this.center = center;
        this.size = size;
        const radius = size / 2;
        const xs: number[] = [];

        for (let i = 0; i < count; i++) {

            const mesh = new Mesh(geometry, material);
            //const meshLight = new PointLight( 0xfedd1f, 0.05 );
            const pivot = new Object3D();
            pivot.position.copy(center);
            //mesh.add(meshLight);
            pivot.add(mesh);


            pivot.rotateZ(Math.random() * Math.PI);
            pivot.rotateY(-Math.random() * Math.PI);

            /*
            
            const x = 0;
            do{
                const x = Math.random() * size - radius;
                mesh.position.x = x;
            }while (Math.abs(radius*0.3 - Math.abs(x))*Math.random() > radius*0.15) */

            const orbitLevel = Math.random();
            if (orbitLevel > 0.5) {
                mesh.position.x = this.gaussianRandom(0, radius * 0.2)

            } else if (orbitLevel < 0.5 && orbitLevel > 0.1) {

                mesh.position.x = this.gaussianRandom(radius * 0.2, radius * 0.7)
            }
            else {
                mesh.position.x = this.gaussianRandom(radius * 0.7, radius)
            }

            xs.push(mesh.position.x);

            //mesh.position.y = Math.random() * size - size/2;
            //mesh.position.z = Math.random() * size - size/2;

            mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 5 + 1;

            mesh.visible = false;



            this.pivots.push(pivot);

            this.pivotSpeed.push(Math.random() * size / (Math.abs(mesh.position.x) + 0.0001) + 0.3);
            this.meshes.push(mesh);

        }

        console.group(xs)

        this.sunLight = new PointLight(0xfe9b14, 200, size, 7);
        this.sunLight.position.copy(center);
        //const sunGeometry = new SphereGeometry( 5, 32, 16 );
        //const sunMaterial = new MeshLambertMaterial( { color: 0xfe9b14 , emissive: 0xfe9b14 } );
        //this.sunMesh = new Mesh( sunGeometry, sunMaterial );
        //this.sunMesh.position.copy(center);

        const textureLoader = new TextureLoader();
        const textureFlare0 = textureLoader.load('assets/lensflare0.png');
        const textureFlare3 = textureLoader.load('assets/lensflare3.png');

        this.lensflare = new Lensflare();
        this.lensflare.addElement(new LensflareElement(textureFlare0, size/10, 0, new THREE.Color(0xfe9b14)));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 60, 1));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 70, 1.4));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 120, 1.6));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 70, 2));



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
        for (let i = 0, il = this.meshes.length; i < il; i++) {
            scene.add(this.pivots[i]);
        }
        //scene.add(this.sunMesh);
        scene.add(this.sunLight);
        this.sunLight.add(this.lensflare);
    }

    public renderSolarSystem() {
        if (this.visible) {
            //const timer = 0.0001 * Date.now();
            for (let i = 0, il = this.meshes.length; i < il; i++) {
                const pivot = this.pivots[i];
                pivot.rotateY(this.pivotSpeed[i] * 0.015);
                pivot.rotateOnWorldAxis(new Vector3(0, 0, 1), 0.01);
            }
        }
    }

    public toggleSolarSystem() {
        /* object.traverse ( function (child) {
            child.visible = false;
        } */

        for (let i = 0, il = this.meshes.length; i < il; i++) {
            this.meshes[i].visible = !this.meshes[i].visible;
        }
        this.visible = !this.visible;

    }
}
