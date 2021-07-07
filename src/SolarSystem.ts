import { Mesh, MeshBasicMaterial, Object3D, Scene, SphereGeometry, Vector3 } from "three";

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
    private sunMesh: Mesh;
    private center: Vector3;
    private size: number;
    visible: Boolean = false;
    
    public constructor(center: Vector3, size: number, count: number){
        
        const geometry = new SphereGeometry( 0.1, 32, 16 );
        const material = new MeshBasicMaterial( { color: 0xffffff } );
        const material2 = new MeshBasicMaterial( { color: 0xff0000 } );
        this.center=center;
        this.size=size;

        for ( let i = 0; i < count; i ++ ) {

            const mesh = new Mesh( geometry, material );
            const pivot = new Mesh( geometry, material2 );
            pivot.position.copy(center);
            pivot.add(mesh);

            //pivot.rotation.y=Math.random()*Math.PI;
            pivot.rotation.z=Math.random()*Math.PI;

            mesh.position.x = Math.random() * size - size/2;
            //mesh.position.y = Math.random() * size - size/2;
            //mesh.position.z = Math.random() * size - size/2;

            mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 10 + 1;

            mesh.visible=false;            
            
            this.pivots.push(pivot);
            this.meshes.push(mesh);
            this.pivotSpeed.push(Math.random());

        }

        const sunGeometry = new SphereGeometry( 5, 32, 16 );
        const sunMaterial = new MeshBasicMaterial( { color: 0xffff00 } );
        this.sunMesh = new Mesh( sunGeometry, sunMaterial );
        this.sunMesh.position.copy(center);

    }

    public addToScene(scene:Scene){
        for ( let i = 0, il = this.meshes.length; i < il; i ++ ) {
            scene.add(this.pivots[ i ]);
        }
        scene.add(this.sunMesh);
    }

    public renderSolarSystem(){
        if(this.visible)
        {
            const timer = 0.0001 * Date.now();

            for ( let i = 0, il = this.meshes.length; i < il; i ++ ) {

                //const sphere = this.meshes[ i ];

                //sphere.position.x = this.center.x + this.size * Math.cos( timer + i );
                //sphere.position.y = this.center.y + this.size * Math.sin( timer + i );
                
                const pivot = this.pivots[i];
                //pivot.rotateOnAxis(this.center.normalize(),Math.random()*0.1);
                pivot.rotateY(this.pivotSpeed[i]*0.1);
            }
        }
    }

    public toggleSolarSystem()
    {
        /* object.traverse ( function (child) {
            child.visible = false;
        } */

        for ( let i = 0, il = this.meshes.length; i < il; i ++ ) {
            this.meshes[ i ].visible = !this.meshes[ i ].visible;
        }
        this.visible=!this.visible;

    }
}
