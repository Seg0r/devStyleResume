import { Mesh, MeshBasicMaterial, Scene, SphereGeometry } from "three";

export class SolarSystem {

    private _meshes: Mesh[] = [];
    public get meshes(): Mesh[] {
        return this._meshes;
    }
    public set meshes(value: Mesh[]) {
        this._meshes = value;
    }
    visible: Boolean = false;
    
    public constructor(count: number){
        
        const geometry = new SphereGeometry( 0.1, 32, 16 );
        const material = new MeshBasicMaterial( { color: 0xffffff } );

        for ( let i = 0; i < count; i ++ ) {

            const mesh = new Mesh( geometry, material );

            mesh.position.x = Math.random() * 100 - 5;
            mesh.position.y = Math.random() * 100 - 5;
            mesh.position.z = Math.random() * 100 - 5;

            mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;

            mesh.visible=false;
            this.meshes.push( mesh );

        }
    }

    public addToScene(scene:Scene){
        for ( let i = 0, il = this.meshes.length; i < il; i ++ ) {
            scene.add(this.meshes[ i ]);
        }
    }

    public renderSolarSystem(){
        if(this.visible)
        {
            const timer = 0.0001 * Date.now();

            for ( let i = 0, il = this.meshes.length; i < il; i ++ ) {

                const sphere = this.meshes[ i ];

                sphere.position.x = 5 * Math.cos( timer + i );
                sphere.position.y = 5 * Math.sin( timer + i * 1.1 );

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

    }
}
