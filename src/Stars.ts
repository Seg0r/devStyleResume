import * as THREE from 'three';
import { Camera, Group, Scene, Spherical, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface MeshState{
    mesh:THREE.Mesh;
    startRotation: number; 
    distance: number;     
}

export class Stars {

    univerSize: number;
    starsGroup: THREE.Group = new Group();
    stars: MeshState[] = [];
    camera: THREE.Camera;
    center: Vector3;

    lastSpherical = new Spherical();
    currSphelical = new Spherical();

    horizontalFactor = 0;
    verticalFactor = 0;

    offset = new THREE.Vector3(); // so camera.up is the orbit axis
    quat:THREE.Quaternion;
    spherical = new THREE.Spherical();

    constructor(universSize: number, starsCount: number, camera: Camera) {

        this.univerSize=universSize*2;
        this.camera=camera;

        const geometry2 = new THREE.SphereBufferGeometry(universSize/4000,8,5);
        const material2 = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        this.center = new Vector3(0,0,0);
        const meshScaleFactor=universSize/2;

        for (let i = 0; i < starsCount; i++) {
            let x,y,z;

            x = THREE.MathUtils.randFloatSpread(this.univerSize);
            y = THREE.MathUtils.randFloatSpread(this.univerSize);
            z = THREE.MathUtils.randFloatSpread(this.univerSize);

            const mesh = new THREE.Mesh( geometry2, material2 )
            mesh.position.set(x, y, z);
            const distanceX = new Vector2(x,z).distanceTo(new Vector2(this.center.x,this.center.z));
            const distance = mesh.position.distanceTo(this.center);
            mesh.scale.set(0.01+distance/meshScaleFactor,0.01+distance/meshScaleFactor,0.01+distance/meshScaleFactor);
            mesh.lookAt(this.center);
            
            //needed to synchronize start angle of all stars
            mesh.rotateOnAxis(new Vector3(0,0,1),0);
            
            this.starsGroup.add(mesh);
            
            this.stars.push({mesh:mesh,startRotation:mesh.rotation.z, distance:distanceX});
        }

        this.quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
    }

    public addToScene(scene: Scene) {
        scene.add(this.starsGroup);
    }

    timeout = false;

    public render(){

        const f = this.calcCameraRotationSpeed();

        const rotationAngle = -Math.atan2(f.verticalFactor,f.horizontalFactor);
        let scaleFactor = Math.max(Math.abs(f.horizontalFactor),Math.abs(f.verticalFactor))
        if(scaleFactor>0.0001 && scaleFactor < 1){
            this.scaleAndRotateStars(scaleFactor,rotationAngle);
        }
    }   


    private scaleAndRotateStars(scaleFactor : number,rotationValue: number){
        const cameraDist = this.camera.position.distanceTo(this.center);
        for(let i=0; i < this.stars.length; i++){
            let sign= cameraDist < this.stars[i].mesh.position.distanceTo(this.camera.position) ? 1 : -1;
            let scaleFactor2=scaleFactor*this.distanceFactor(this.stars[i].distance);
            this.stars[i].mesh.scale.setX(this.stars[i].mesh.scale.y+scaleFactor2);
            this.stars[i].mesh.rotation.z = this.stars[i].startRotation + rotationValue*sign;
        }
    }


    private distanceFactor(distance: number): number{
        return Math.pow(distance,1.85)/(this.univerSize/8);
    }

    private calcCameraRotationSpeed(): { horizontalFactor: number, verticalFactor: number } {
    
        this.offset.copy(this.camera.position).sub(this.center); // rotate offset to "y-axis-is-up" space
        this.offset.applyQuaternion(this.quat); // angle from z-axis around y-axis
        this.spherical.setFromVector3(this.offset);
    
        this.horizontalFactor = this.lastSpherical.theta - this.spherical.theta;
        this.verticalFactor = this.lastSpherical.phi - this.spherical.phi;
    
        this.lastSpherical.copy(this.spherical);
    
        return { horizontalFactor: this.horizontalFactor, verticalFactor: this.verticalFactor }
    }
}