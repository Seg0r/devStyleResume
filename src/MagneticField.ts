
import * as THREE from 'three';
import {CatmullRomCurve3, Group, Line, LineCurve3, Mesh, MeshToonMaterial, Quaternion, Scene, SphereBufferGeometry, Vector2, Vector3 } from 'three';
import { DirectionAngles } from './SolarSystem';
import { gaussianRandom } from './utils/math';


export class MagneticField {

    curves:CatmullRomCurve3[] = [];
    markers: Mesh[] = [];
    lines: Line[] = [];

    public constructor(center: Vector3, size: number, count: number, initAngles: DirectionAngles) {

        this.bornField(count, center, size,initAngles);
    }

    private bornField(count: number, center: THREE.Vector3, size: number,initAngles: DirectionAngles) {

        const lineMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.5,
            color: 0x0099ff,
            linewidth: 5
       });

       const marketGeometry = new SphereBufferGeometry(10, 4, 3);
       const markerMaterial = new MeshToonMaterial({ color: 0xfedd1f });

        for ( let i = 0; i < count; i ++ ) {

            const mesh = new Mesh(marketGeometry, markerMaterial);
            this.markers.push(mesh);

            const xRadius = gaussianRandom(size*2,size*3);
            
            const curve2 = new THREE.EllipseCurve(
                center.x+xRadius,  center.y,            // ax, aY
                xRadius, xRadius*0.8,           // xRadius, yRadius
                0,  2 * Math.PI,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );

            const points3: Vector3[] = [];

            curve2.getPoints( 200 ).forEach(element => {
                points3.push(new Vector3(element.x,element.y,0))
            });

            const curve = new CatmullRomCurve3(points3,true);
            const points = curve.getPoints( 200 );
            const geometry = new THREE.BufferGeometry().setFromPoints( points );

            

            const fieldLines = new THREE.Line(geometry, lineMaterial);
            //fieldLines.position.set(0,0,0);

            fieldLines.add(mesh);


            const rot = Math.random()*Math.PI*2 - Math.PI;
            fieldLines.rotateY(rot);
            //fieldLines.rotateZ(initAngles.alpha1);
            //fieldLines.rotateX(initAngles.beta2);

            this.curves.push(curve);
            this.lines.push(fieldLines)
        }

        // for ( let i = 0; i < count; i ++ ) {

        //     const xRadius = gaussianRandom(size*250,size*300);
        //     const ax = xRadius ;
        //     const curve2 = new THREE.EllipseCurve(
        //         center.x+ax,  center.y,            // ax, aY
        //         xRadius, xRadius*0.25,           // xRadius, yRadius
        //         Math.PI/1.08,   -Math.PI/1.08,  // aStartAngle, aEndAngle
        //         false,            // aClockwise
        //         0                 // aRotation
        //      );
            

        //     const points3: Vector3[] = [];

        //     curve2.getPoints( 200 ).forEach(element => {
        //         points3.push(new Vector3(element.x,element.y,0))
        //     });

        //     const curve = new CatmullRomCurve3(points3,false);
        //     const points = curve.getPoints( 200 );
        //     const geometry = new THREE.BufferGeometry().setFromPoints( points );

        //     const rot = Math.random()*Math.PI*4 - Math.PI*2
            
        //     //geometry.rotateY(rot);
        //     //geometry.rotateZ(-initAngles.beta2);
        //     //geometry.rotateX(-initAngles.alpha1);

        //     const fieldLines = new THREE.Line(geometry, lineMaterial);
        //     this.curves.push({curve:curve,rotation:rot});
        //     this.lineGroup.add( fieldLines );
        // }
    }

    public addToScene(scene: Scene) {
        this.lines.forEach(element => {
            scene.add(element)
        });
    }

    t =0;

    public render(){
        
        for(let i=0;i<this.curves.length;i++){
            var pos = this.curves[i].getPoint(this.t);
            this.markers[i].position.set( pos.x, pos.y, pos.z );
        }
        this.t = (this.t >= 1) ? 0 : this.t += 0.001;
    }
}