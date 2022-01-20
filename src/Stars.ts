import * as THREE from 'three';
import { Camera, Euler, Group, Quaternion, Scene, Spherical, Vector2, Vector3 } from 'three';
import { CameraUtils } from './CameraUtils';
import { DEFAULT_UNIVERSE_SIZE } from './main';

interface MeshState {
    mesh: THREE.Mesh;
    startRotation: number;
    distance: number;
}

const factorDelta = 0.0004;

export class Stars {

    univerSize: number;
    starsGroup: THREE.Group = new Group();
    stars: MeshState[] = [];
    camera: CameraUtils;
    center: Vector3;
    currScaleFactor: number = 0;
    currDeltaFactorMultiplayer = 1;
    universeFactor: number;


    constructor(universSize: number, starsCount: number, camera: CameraUtils) {

        this.universeFactor = DEFAULT_UNIVERSE_SIZE/universSize;
        this.univerSize = universSize * 2;
        this.camera = camera;

        const geometry2 = new THREE.SphereBufferGeometry(universSize / 4000);
        const material2 = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
        this.center = this.camera.cameraLookAt;
        const meshScaleFactor = universSize /1.5;

        for (let i = 0; i < starsCount; i++) {
            let x, y, z;

            x = THREE.MathUtils.randFloatSpread(this.univerSize);
            y = THREE.MathUtils.randFloatSpread(this.univerSize);
            z = THREE.MathUtils.randFloatSpread(this.univerSize);

            const mesh = new THREE.Mesh(geometry2, material2)
            mesh.position.set(x, y, z);
            const distanceX = new Vector2(x, z).distanceTo(new Vector2(this.center.x, this.center.z));
            const distance = mesh.position.distanceTo(this.center);
            // mesh.scale.set(0.01 + distance / meshScaleFactor, 0.01 + distance / meshScaleFactor, 0.01 + distance / meshScaleFactor);
            mesh.scale.set(0.01 + distance / meshScaleFactor, 0.01 + distance / meshScaleFactor, 0.01 + distance / meshScaleFactor);
            mesh.lookAt(this.center);

            //needed to synchronize start angle of all stars
            mesh.rotateOnAxis(new Vector3(0, 0, 1), 0);

            this.starsGroup.add(mesh);

            this.stars.push({ mesh: mesh, startRotation: mesh.rotation.z, distance: distanceX });
        }

    }

    public addToScene(scene: Scene) {
        scene.add(this.starsGroup);
    }

    timeout = false;

    public render() {

        const f = this.camera.calcCameraRotationSpeed();

        const rotationAngle = -Math.atan2(f.verticalFactor, f.horizontalFactor);
        let scaleFactor = Math.max(Math.abs(f.horizontalFactor), Math.abs(f.verticalFactor))
        if (scaleFactor > 0.0001 && scaleFactor < 100) {
            this.scaleAndRotateStars(scaleFactor, rotationAngle);
        }
    }


    private scaleAndRotateStars(scaleFactor: number, rotationValue: number) {
        let factorToSet = 0;
        let factorDiff = scaleFactor - this.currScaleFactor
        const cameraDist = this.camera.position.distanceTo(this.center);

        if (factorDiff > 0) {
            factorToSet = this.currScaleFactor + factorDelta*this.currDeltaFactorMultiplayer;
            this.currDeltaFactorMultiplayer+=10
        } else {
            factorToSet = scaleFactor;
            this.currDeltaFactorMultiplayer=1;
        }

        this.currScaleFactor = factorToSet;
        for (let i = 0; i < this.stars.length; i++) {
            let sign = cameraDist < this.stars[i].mesh.position.distanceTo(this.camera.position) ? 1 : -1;
            let scaleFactorWithDistance = factorToSet * this.distanceFactor(this.stars[i].distance);
            this.stars[i].mesh.scale.setX(this.stars[i].mesh.scale.y + scaleFactorWithDistance);
            this.stars[i].mesh.rotation.z = this.stars[i].startRotation + rotationValue * sign;
        }
    }


    private distanceFactor(distance: number): number {
        //TODO: scale with universe properly
        return Math.pow(distance*this.universeFactor, 1.85) / (this.univerSize / 8);
    }
}