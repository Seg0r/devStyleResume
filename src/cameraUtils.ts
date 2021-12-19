import * as TWEEN from '@tweenjs/tween.js';
import { Vector3, QuadraticBezierCurve3, Quaternion, PerspectiveCamera, Camera, Curve } from 'three';


interface TweenObject{
    t: number;
    pos: number
}


declare type UnknownProps = Record<string, any>;

export class CameraUtils {

    camera: Camera;
    timer: number = 0;
    vector = new Vector3;
    moving: boolean = false;
    currTweenV3: TWEEN.Tween<Vector3> | undefined;
    currTweenObject: TWEEN.Tween<TweenObject> | undefined;

    currTween: TWEEN.Tween<UnknownProps> | undefined;
    origin: Vector3;
    yAxis= new Vector3(0,1,0);
    startPosition: number = 0;


    constructor(camera: Camera, origin: Vector3) {
        this.camera = camera;
        this.origin = origin;
    }


    //camera tweens
    private async cameraTweenToPos(cameraPos: Readonly<Vector3>, time: number) {

        const _this = this;
        return new Promise<void> (function(resolve) {
            console.log(cameraPos);        
            const nextTween = new TWEEN.Tween(_this.camera.position)
                .to(cameraPos, time)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onComplete(()=>{
                    resolve();
                });

            if(_this.currTweenV3 && _this.currTweenV3.isPlaying()){
                _this.currTweenV3.chain(nextTween);
            }else{
                _this.currTweenV3=nextTween;
                _this.currTweenV3.start();
            }
        })
    }

    private async chainTweens(tween: TWEEN.Tween<TweenObject>){
        const _this = this;

        return new Promise<void> (function(resolve) {

            const anyTween = tween as any;

            const orgCallback = anyTween['_onCompleteCallback'];

            anyTween.onComplete((obj:TweenObject)=>{
                if(orgCallback)
                    orgCallback();
                _this.startPosition=obj.pos;
                resolve();
            });

            if(_this.currTween && _this.currTween.isPlaying()){
                _this.currTween.chain(tween);
            }else{
                _this.currTween=tween;
                _this.currTween.start();
            }
        });
    }

    private async cameraTweenAlongCurve(curve: Readonly<Curve<Vector3>>, position: number, time: number) {

        const _this = this;

        const obj:TweenObject = {t:0,pos:_this.startPosition}

        const tween = new TWEEN.Tween(obj)
            .to({ t:0, pos: position }, time)
            .onUpdate((tween) => {
                _this.camera.position.copy(curve.getPoint(tween.pos));
                _this.camera.lookAt(_this.origin);
            })
            .easing(TWEEN.Easing.Cubic.InOut);
            
        this.chainTweens(tween).then(()=>{
            console.log("promise resolved")
        });
    }



    private cameraTweenLook(viewFromPoint: Readonly<Vector3>,
        lookAtPoint: Readonly<Vector3>, time: number,
        easingFun: (amount: number) => number) {

        const endQuaternion = CameraUtils.calcCameraQuaternionLookAt(this.camera, viewFromPoint,lookAtPoint)
        this.tweenCameraQuaternion(time, endQuaternion, easingFun);
    }

    private tweenCameraRotation(angle: number,axis: Vector3, time: number, easingFun: (amount: number) => number){

        const endQuaternion = CameraUtils.calcCameraQuaternionRotateOnAxis(this.camera, axis,angle)
        this.tweenCameraQuaternion(time, endQuaternion, easingFun);
    }

    
    private tweenCameraQuaternion(time: number, endQuaternion: Quaternion, easingFun: (amount: number) => number) {
        let part = { t: 0 };

        new TWEEN.Tween(part)
            .to({ t: 1 }, time)
            .onUpdate((tween) => {
                this.camera.quaternion.slerp(endQuaternion, tween.t);
            })
            .easing(easingFun)
            .start();
    }


    public tiltCamera(lookAt?: Vector3) {
        this.timer = new Date().getTime() * 0.0001;
        this.camera.position.add(this.vector.set(Math.cos(this.timer) * 0.6, 0, 0));
        this.camera.position.add(this.vector.set(0, Math.sin(this.timer) * 0.3, 0));
        if (lookAt)
            this.camera.lookAt(lookAt);
    }



    public moveCameraToPointFromSpline(spline: Readonly<Curve<Vector3>>, point: number, time: number) {
        var splinePoint = spline.getPoint(point);
        const promise = this.cameraTweenToPos(splinePoint, time);
        promise.then(() => {
            console.log("promise received")
        })
    }

    public moveCameraAlongSplineAndLean(curve: Readonly<Curve<Vector3>>, startPosition: number, endPosition: number, time: number, leanAngle: number) {

        const endQuaternion = CameraUtils.calcCameraQuaternionLookAt(this.camera, curve.getPoint(endPosition),this.origin,leanAngle)

        // Tween
        let part: TweenObject = { t: 0 , pos:this.startPosition};
        let startQuat: Quaternion ;
        let calcQuat = new Quaternion();
        
        const newTween = new TWEEN.Tween(part)
            .onStart((tween)=>{
                startQuat = new Quaternion().copy(this.camera.quaternion);// src quaternion
                tween.pos=this.startPosition;
            })
            .to({ t: 1, pos: endPosition}, time)
            .onUpdate((tween) => {
                this.camera.position.copy(curve.getPoint(tween.pos));
                calcQuat.slerpQuaternions(startQuat,endQuaternion,tween.t)
                this.camera.quaternion.copy(calcQuat);
            })
            .easing(TWEEN.Easing.Cubic.InOut);
        
        this.chainTweens(newTween).then(()=>{
        });
            
    }

    


    static calcCameraQuaternionLookAt(_camera: Readonly<Camera>, endPosition: Vector3, lookAtVector: Vector3, leanAngle?: number): Quaternion{
        const camera: Camera = _camera.clone();
        // backup original rotation and position
        const startQuaternion = new Quaternion().copy(camera.quaternion);
        const startPosition = new Vector3().copy(camera.position);
        // move and rotate (with lookAt + lean)
        camera.position.copy(endPosition);
        camera.lookAt(lookAtVector);
        if(leanAngle)
            camera.rotateY(leanAngle);
        //save quaternion
        return new Quaternion().copy(camera.quaternion);        
    }

    static calcCameraQuaternionRotateOnAxis(_camera: Readonly<Camera>, axis: Vector3, angle: number): Quaternion{
        const camera: Camera = _camera.clone();
        // backup original rotation and position
        const startQuaternion = new Quaternion().copy(camera.quaternion);
        const startPosition = new Vector3().copy(camera.position);
        // move and rotate 
        camera.rotateOnAxis(axis,angle);
        //save quaternion
        return new Quaternion().copy(camera.quaternion);
    }

}