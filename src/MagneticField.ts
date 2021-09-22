
import * as THREE from 'three';
import {Curve, Group, MeshToonMaterial, Points, Scene, SphereBufferGeometry, Vector2, Vector3 } from 'three';
import { DirectionAngles } from './SolarSystem';
import { gaussianRandom } from './utils/math';


export class MagneticField {

    lineGroup: Group = new Group;
    curves:{curve: Curve<Vector2>, rotation: number}[] = [];
    points: Points;

    public constructor(center: Vector3, size: number, count: number, initAngles: DirectionAngles) {

        this.bornField(count, center, size,initAngles);
        this.points = this.bornMarkers(count, center);
        
    }

    private bornMarkers (count: number,center: Vector3) : THREE.Points{
        const vertices = [];
        const geometry = new THREE.BufferGeometry();
        for ( let i = 0; i < count; i ++ ) {
            const x = center.x;
            const y = center.y;
            const z = center.z;

            vertices.push( x, y, z );
           
        }
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        const material = new THREE.PointsMaterial( { color: 0x95cfff } );
        return new THREE.Points( geometry, material );
    }


    private bornField(count: number, center: THREE.Vector3, size: number,initAngles: DirectionAngles) {

        const lineMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.5,
            color: 0x0099ff,
            linewidth: 5
       });

        for ( let i = 0; i < count; i ++ ) {

            const xRadius = gaussianRandom(size*2,size*3);
            const ax = xRadius * (Math.round(Math.random()) ? -1:1);
            const curve = new THREE.EllipseCurve(
                ax,  0,            // ax, aY
                xRadius, xRadius*0.8,           // xRadius, yRadius
                0,  2 * Math.PI,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );
            
            const points = curve.getPoints( 200 );
            const geometry = new THREE.BufferGeometry().setFromPoints( points );
            const rot = Math.random()*Math.PI*2 - Math.PI;
            this.curves.push({curve:curve,rotation:rot});
            geometry.rotateY(rot);
            geometry.rotateZ(-initAngles.beta2);
            geometry.rotateX(-initAngles.alpha1);


            const fieldLines = new THREE.Line(geometry, lineMaterial);
            this.lineGroup.add( fieldLines );
        }

        for ( let i = 0; i < count; i ++ ) {

            const xRadius = gaussianRandom(size*250,size*300);
            //const sign = (Math.round(Math.random()) ? -1:1);
            const ax = xRadius ;
            let curve:THREE.EllipseCurve;
            //if(sign>0){
            curve = new THREE.EllipseCurve(
                ax,  0,            // ax, aY
                xRadius, xRadius*0.2,           // xRadius, yRadius
                Math.PI/1.1,   -Math.PI/1.1,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
             );
            
            const points = curve.getPoints( 200 );
            const geometry = new THREE.BufferGeometry().setFromPoints( points );
            const rot = Math.random()*Math.PI*4 - Math.PI*2
            this.curves.push({curve:curve,rotation:rot});
            geometry.rotateY(rot);
            geometry.rotateZ(-initAngles.beta2);
            geometry.rotateX(-initAngles.alpha1);

            const fieldLines = new THREE.Line(geometry, lineMaterial);
            this.lineGroup.add( fieldLines );
        }
    }

    public addToScene(scene: Scene) {
        //scene.add(this.lineGroup);
        scene.add(this.points);
    }

    t =0;

    public render(){
        let point:Vector2=new Vector2();
        for(let i=0;i>this.curves.length;i++){
            //point=this.curves[i].getPoint(this.t)
        }
        this.t = (this.t >= 1) ? 0 : this.t += 0.002;
    }
}