import * as TWEEN from '@tweenjs/tween.js';
import { Vector3, QuadraticBezierCurve3, Quaternion, PerspectiveCamera, Camera, Curve } from 'three';

class TweenObject{
    value: number;

    constructor(val: number){
        this.value=val;
    }

}

export class CameraUtils {

    camera: Camera;
    timer: number = 0;
    vector = new Vector3;
    moving: boolean = false;
    currTween: TWEEN.Tween<Vector3> | undefined;
    currTweenOnCurve: TWEEN.Tween<TweenObject> | undefined;
    tweenOnCurveVal = new TweenObject(0);
    origin: Vector3;


    constructor(camera: Camera, origin: Vector3) {
        this.camera = camera;
        this.origin = origin;
    }


    //camera tweens
    public async cameraTweenToPos(cameraPos: Readonly<Vector3>, time: number) {

        const _this = this;
        return new Promise<void> (function(resolve) {
            console.log(cameraPos);        
            const nextTween = new TWEEN.Tween(_this.camera.position)
                .to(cameraPos, time)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onComplete(()=>{
                    resolve();
                });

            if(_this.currTween && _this.currTween.isPlaying()){
                _this.currTween.chain(nextTween);
            }else{
                _this.currTween=nextTween;
                _this.currTween.start();
            }
        })
        
    }

    private returnPromise(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public async cameraTweenAlongCurve(curve: Readonly<Curve<Vector3>>, position: number, time: number) {

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
            
            if(_this.currTween && _this.currTween.isPlaying()){
                _this.currTween.chain(nextTween);
            }else{
                _this.currTweenOnCurve=nextTween;
                _this.currTweenOnCurve.start();
            }
        })
    }



    public cameraTweenLook(viewFromPoint: Readonly<Vector3>,
        lookAtPoint: Readonly<Vector3>, time: number,
        easingFun: (amount: number) => number) {
        // backup original rotation
        const startQuaternion = new Quaternion().copy(this.camera.quaternion);
        // final rotation (with lookAt)
        const startPosition = new Vector3().copy(this.camera.position);
        this.camera.position.copy(viewFromPoint);
        this.camera.lookAt(lookAtPoint);
        const endQuaternion = new Quaternion().copy(this.camera.quaternion);
        // revert to original rotation
        this.camera.quaternion.copy(startQuaternion);
        this.camera.position.copy(startPosition);
        // Tween
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

    public moveCameraAlongSpline(curve: Readonly<Curve<Vector3>>, position: number, time: number) {
        const promise = this.cameraTweenAlongCurve(curve,position,3000);
        promise.then(() => {
            console.log("promise received");
        })
    }

}