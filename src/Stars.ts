import * as THREE from 'three';
import { Camera, Group, Scene, Vector2, Vector3 } from 'three';

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
    }

    public addToScene(scene: Scene) {
        scene.add(this.starsGroup);
    }

    timeout = false;

    public render(verticalFactor : number, horizontalFactor: number){

        const rotationAngle = -Math.atan2(verticalFactor,horizontalFactor);
        const scaleFactor = Math.max(Math.abs(horizontalFactor),Math.abs(verticalFactor))
        if(scaleFactor>0.001 && scaleFactor < 1){
            this.calculateDrawRange(scaleFactor,rotationAngle);
        }
    }   


    private calculateDrawRange(scaleFactor : number,rotationValue: number){
        const cameraDist = this.camera.position.distanceTo(this.center);
        for(let i=0; i < this.stars.length; i++){
            let sign= cameraDist < this.stars[i].mesh.position.distanceTo(this.camera.position) ? 1 : -1;
            let scaleFactor2=scaleFactor*this.distanceFactor(this.stars[i].distance);
            this.stars[i].mesh.scale.setX(0.5+scaleFactor2);
            this.stars[i].mesh.rotation.z = this.stars[i].startRotation + rotationValue*sign;
        }
    }


    private distanceFactor(distance: number): number{
        return Math.pow(distance,1.85)/(this.univerSize/8);
    }
}