import * as TWEEN from '@tweenjs/tween.js';
import { Vector3, QuadraticBezierCurve3, Quaternion, PerspectiveCamera, Camera, Curve } from 'three';

interface TweenCameraInterface {
    tween: TWEEN.Tween<UnknownProps>;
    onCompleteCallback:(object: UnknownProps)=>void;
}

// class TweenCamera implements TweenCameraInterface{
//     tween: TWEEN.Tween<UnknownProps>;
//     onCompleteCallback: (object: UnknownProps) => void;

//     constructor(tweenDef: () => TweenCameraInterface){
//         this.tween=tweenDef.tween;
//         this.onCompleteCallback = tweenDef.onCompleteCallback;
//     }
    
// }

class TweenObject{
    value: number;

    constructor(val: number){
        this.value=val;
    }
}

class TweenAlongSpline{
    curve: Curve<Vector3>;
    leanAngle: number = 0;
    time: number;
    endPosition: number;

    constructor(curve: Curve<Vector3>, endPosition: number, time: number, leanAngle?: number){
        this.curve=curve;
        this.endPosition=endPosition;
        this.time=time;
        if(leanAngle)
            this.leanAngle=leanAngle;
    }
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
    tweenOnCurveVal = new TweenObject(0);
    origin: Vector3;
    yAxis= new Vector3(0,1,0);


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

    private async chainTweens(tweenDefPrepare: ()=>TweenCameraInterface){
        const _this = this;
        const tweenDef: TweenCameraInterface =  tweenDefPrepare();
        return new Promise<void> (function(resolve) {
            tweenDef.tween.onComplete((object)=>{
                tweenDef.onCompleteCallback(object);
                resolve();
            });

            if(_this.currTween && _this.currTween.isPlaying()){
                _this.currTween.chain(tweenDef.tween);
            }else{
                _this.currTween=tweenDef.tween;
                _this.currTween.start();
            }
        });
    }

    private async cameraTweenAlongCurve(curve: Readonly<Curve<Vector3>>, position: number, time: number) {

        const _this = this;
        return new Promise<void> (function(resolve) {

        console.log(curve.getPoint(position));
        const nextTween = new TWEEN.Tween(_this.tweenOnCurveVal)
            .to({ value: position }, time)
            .onUpdate((tween) => {
                _this.camera.position.copy(curve.getPoint(tween.value));
                _this.camera.lookAt(_this.origin);
            })
            .easing(TWEEN.Easing.Cubic.InOut)
            .onComplete(()=>{
                resolve();
            });
            
            if(_this.currTweenObject && _this.currTweenObject.isPlaying()){
                _this.currTweenObject.chain(nextTween);
            }else{
                _this.currTweenObject=nextTween;
                _this.currTweenObject.start();
            }
        })
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

        const tweenObj = new TweenAlongSpline(curve,endPosition,time,leanAngle);
        
        const tweenPrepare = ():TweenCameraInterface=>{

            const endQuaternion = CameraUtils.calcCameraQuaternionLookAt(this.camera, curve.getPoint(endPosition),this.origin,leanAngle)

            // Tween
            let part = { t: 0 };
            endPosition = Math.round((endPosition+ Number.EPSILON) * 100) / 100;
            let positionDelta = endPosition-startPosition;
            
            const tween = new TWEEN.Tween(part)
                .to({ t: 1 }, time)
                .onUpdate((tween) => {
                    this.camera.quaternion.slerp(endQuaternion, tween.t);
                    this.camera.position.copy(curve.getPoint(startPosition+(tween.t*positionDelta)));
                })
                .easing(TWEEN.Easing.Cubic.InOut);

            const onCompleteCallback = ()=>{
                
            }
        
            return {tween,onCompleteCallback};
        }

        this.chainTweens(tweenPrepare);
            
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