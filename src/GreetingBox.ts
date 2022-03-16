import * as TWEEN from '@tweenjs/tween.js';
import { BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Quaternion, Scene, TextureLoader, Vector3 } from 'three';

export class GreetingBox {
    private greetingBox:Mesh;
 
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
    
    private currRotateState: number = -1;
    private startRot : Quaternion;

    private q1 = new Quaternion().setFromAxisAngle ( new Vector3(0, 1, 0),-(this.deg90));
    private q2 = new Quaternion().setFromAxisAngle ( new Vector3(0, 0, 1), this.deg90);
    private q3 = new Quaternion().setFromAxisAngle ( new Vector3(1, 0, 0),-(this.deg90));

    private pos1 : Quaternion;
    private pos2 : Quaternion;
    private pos3 : Quaternion;


	constructor(){

        let loader = new TextureLoader();
        loader.setPath('/assets/box/');
        let materialArray = [
            new MeshBasicMaterial( { map: loader.load("2.png") } ),
            new MeshBasicMaterial( { map: loader.load("empty.png") } ),
            new MeshBasicMaterial( { map: loader.load("empty.png") } ),
            new MeshBasicMaterial( { map: loader.load("3.png") } ),
            new MeshBasicMaterial( { map: loader.load("1.png") } ),
            new MeshBasicMaterial( { map: loader.load("4.png") } )];

        var geometry = new BoxGeometry(10, 10, 10);

        this.greetingBox = new Mesh(geometry,materialArray);

        const edges = new EdgesGeometry( geometry );
        const line = new LineSegments( edges, new LineBasicMaterial( { color: 0xFF2D00 } ) );
        this.greetingBox.add( line );


        this.startRot = this.greetingBox.quaternion.clone();

        this.pos1 = new Quaternion().multiplyQuaternions(this.startRot,this.q1);
        this.pos2 = new Quaternion().multiplyQuaternions(this.pos1,this.q2);
        this.pos3 = new Quaternion().multiplyQuaternions(this.pos2,this.q3);

        this.rotateToPos(this.startRot);
	}


    animateBox(inputOffset: number,startOffset: number, endOffset: number){

        if(inputOffset<startOffset || inputOffset>endOffset){
            throw new Error('Current offset beyond start-end range');
        }
        
        const positionSize = (endOffset - startOffset)/4;
        const pos1End = startOffset + positionSize;
        const pos2End = startOffset + 2* positionSize;
        const pos3End = startOffset + 3* positionSize;

        if(inputOffset<pos1End && this.currRotateState != this.rotateState.pos0){
            this.currRotateState=this.rotateState.pos0;
            this.rotateToPos(this.startRot);
            console.log("Box - animacja 1");
        } else if(inputOffset>=pos1End && inputOffset<pos2End && this.currRotateState != this.rotateState.pos1){
            this.currRotateState=this.rotateState.pos1;
            this.rotateToPos(this.pos1);
            console.log("Box - animacja 2");
        } else if (inputOffset>=pos2End && inputOffset<pos3End && this.currRotateState != this.rotateState.pos2){
            this.currRotateState=this.rotateState.pos2;
            this.rotateToPos(this.pos2);
            console.log("Box - animacja 3");
        } else if (inputOffset>=pos3End && inputOffset<=endOffset && this.currRotateState != this.rotateState.pos3){
            this.currRotateState=this.rotateState.pos3;        
            this.rotateToPos(this.pos3);
            console.log("Box - animacja 4");
        }

        //console.log("input: "+inputOffset + " state: "+this.currRotateState + " tweens: "+ TWEEN.getAll().length);
        
    }

    rotateToPos(destquat:Quaternion){
        let time = {t: 0};
    
        new TWEEN.Tween(time)
        .to({t: 1}, 2000)
        .onUpdate((tween) => {
            this.greetingBox.quaternion.slerp(destquat,tween.t);
        })
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    }

    static updateTweens() {
        TWEEN.update();
    }

    public addToScene(scene: Scene){
        scene.add(this.greetingBox);
    }

    public getPosition(){
        return this.greetingBox.position;
    }
}
