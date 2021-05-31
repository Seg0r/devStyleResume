import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';

export class GreetingBox extends THREE.Mesh {

    greetingBox:THREE.Mesh;
 
    readonly boxZeroX = 0;
    readonly boxZeroY = 0;
    readonly boxZeroZ = 0;

    readonly deg90 = Math.PI/2;

    readonly rotateState = {
        pos0: 0,
        pos1: 1,
        pos2: 2,
        pos3: 3,
    }

    readonly q1 = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 1, 0),-this.deg90);
    readonly q2 = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 0, 1), this.deg90);
    readonly q3 = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(1, 0, 0),-this.deg90);
    
    currRotateState: number = 0;
    startRot : THREE.Quaternion;


	constructor(){
        super()
        const geometry = new THREE.BoxGeometry(10,10,10);
        const material = new THREE.MeshLambertMaterial( { color: 0xffffff } );
        this.greetingBox = new THREE.Mesh(geometry,material);

        this.greetingBox.rotation.fromArray([this.boxZeroX,this.boxZeroY,this.boxZeroZ]);

        var worldAxis = new THREE.AxesHelper(100);
        this.greetingBox.add(worldAxis);
        this.startRot = this.greetingBox.quaternion.clone();
	}
	




    animateBox(inputOffset: number,startOffset: number, endOffset: number){

        if(inputOffset<startOffset || inputOffset>endOffset){
            throw new Error('Current offset beyond start-end range');
        }

        const positionSize = (endOffset - startOffset)/4;
        const pos1End = startOffset + positionSize;
        const pos2End = startOffset + 2* positionSize;
        const pos3End = startOffset + 3* positionSize;

        if(startOffset>=pos1End && inputOffset<pos1End && this.currRotateState != this.rotateState.pos0){
            this.rotateToPos(this.startRot);
            this.currRotateState=this.rotateState.pos0;
        }
        if(inputOffset>=pos1End && inputOffset<pos2End && this.currRotateState != this.rotateState.pos1){
            this.rotateToPos(this.q1);
            this.currRotateState=this.rotateState.pos1;
        } else if (inputOffset>pos2End && inputOffset<pos3End && this.currRotateState != this.rotateState.pos2){
            this.rotateToPos(this.q1.multiply(this.q2));
            this.currRotateState=this.rotateState.pos2;
        } else if (inputOffset>=pos3End && inputOffset<=endOffset && this.currRotateState != this.rotateState.pos3){
            this.rotateToPos(this.q1.multiply(this.q2.multiply(this.q3)));
            this.currRotateState=this.rotateState.pos3;
        }
    }

    rotateToPos(destquat:THREE.Quaternion) {

        let time = {t: 0};
    
        new TWEEN.Tween(time)
        .to({t: 1}, 2000)
        .onUpdate((tween) => {
             this.greetingBox.quaternion.slerp(destquat,tween.t);
        })
        .easing(TWEEN.Easing.Quartic.InOut)
        .start();
    
    };
}
