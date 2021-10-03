import * as THREE from 'three';
import { Group, Scene, Vector3 } from 'three';

interface MeshState{
    mesh:THREE.Mesh; 
    startRotation: number; 
    distance: number;     
}

export class Stars {

    univerSize: number;
    starsGroup: THREE.Group = new Group();
    stars: MeshState[] = [];

    constructor(univerSize: number, starsCount: number) {

        this.univerSize=univerSize*2;

        const geometry2 = new THREE.SphereBufferGeometry(2,3,2);
        const material2 = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        const center = new Vector3(0,0,0);

        for (let i = 0; i < starsCount; i++) {

            const x = THREE.MathUtils.randFloatSpread(univerSize*3);
            const y = THREE.MathUtils.randFloatSpread(univerSize*3);
            const z = THREE.MathUtils.randFloatSpread(univerSize*3);

            const mesh = new THREE.Mesh( geometry2, material2 )
            mesh.position.set(x, y, z);
            mesh.scale.set(4,1,1);
            mesh.lookAt(center);
            
            
            mesh.rotateOnAxis(new Vector3(0,0,1),0);
            
            this.starsGroup.add(mesh);
            
            this.stars.push({mesh:mesh,startRotation:mesh.rotation.z, distance:mesh.position.distanceTo(center)});
        }
    }

    public addStarsToScene(scene: Scene) {
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

        for(let i=0; i < this.stars.length; i++){
            let scaleFactor2=scaleFactor*this.distanceFactor(this.stars[i].distance);
            this.stars[i].mesh.scale.set(1+scaleFactor2,1,1);
            this.stars[i].mesh.rotation.z = this.stars[i].startRotation + rotationValue;
        }
    }

    private distanceFactor(distance: number): number{
        return Math.pow(distance,1.8)/(this.univerSize/8);
    }
}