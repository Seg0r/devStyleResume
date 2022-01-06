import * as TWEEN from '@tweenjs/tween.js';
import { throws } from 'assert';
import { Vector3, QuadraticBezierCurve3, Quaternion, PerspectiveCamera, Camera, Curve, Vector, Points, CatmullRomCurve3, Vector2, Object3D, Euler, Spherical, ArrowHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


interface TweenObject {
    t: number;
    pos: number
}

declare type UnknownProps = Record<string, any>;

const cameraPanLimit = 25;
const deltaPos = 5;

export class CameraUtils {

    camera: Camera;
    timer: number = 0;
    vector = new Vector3;
    moving: boolean = false;
    currTweenV3: TWEEN.Tween<Vector3> | undefined;

    currTween: TWEEN.Tween<UnknownProps> | undefined;
    nextTween: TWEEN.Tween<UnknownProps> | undefined;
    origin: Vector3;
    yAxis = new Vector3(0, 1, 0);
    startPosition: number = 0;

    //camera pan variables
    cameraCenter = new Vector3();
    mouse = new Vector2(0, 0);
    private _panEnabled: boolean = true;
    cameraDir: Vector3 = new Vector3();
    private _cameraLookAt = new Vector3();

    //camera rotation factors
    lastPos = new Vector3();
    currentCameraPos: Vector3 = new Vector3();

    //pan and rotation variables
    sideVector = new Vector3();
    upVector = new Vector3();
    dirVector = new Vector3();
    orbitControls: OrbitControls;

    public get cameraLookAt() {
        return this._cameraLookAt;
    }
    public set cameraLookAt(value) {
        this._cameraLookAt = value;
    }

    public get panEnabled(): boolean {
        return this._panEnabled;
    }

    public set panEnabled(value: boolean) {
        if (value) {
            this.setPanCameraConstants();
        }
        this._panEnabled = value;
    }

    public get position(): Vector3 {
        return this.camera.position;
    }

    public get up(): Vector3 {
        return this.camera.up;
    }


    constructor(camera: Camera, origin: Vector3, controls: OrbitControls) {
        this.camera = camera;
        this.origin = origin;
        this.camera.lookAt(origin);
        this.setPanCameraConstants();
        this.orbitControls=controls;
    }



    //camera tweens
    private async cameraTweenToPos(cameraPos: Readonly<Vector3>, time: number) {

        const _this = this;
        return new Promise<void>(function (resolve) {
            // console.log(cameraPos);
            const nextTween = new TWEEN.Tween(_this.camera.position)
                .to(cameraPos, time)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onComplete(() => {
                    resolve();
                });

            if (_this.currTweenV3 && _this.currTweenV3.isPlaying()) {
                _this.currTweenV3.chain(nextTween);
            } else {
                _this.currTweenV3 = nextTween;
                _this.currTweenV3.start();
            }
        })
    }

    private async chainTweens(tween: TWEEN.Tween<TweenObject>) {
        const _this = this;

        return new Promise<void>(function (resolve) {

            const anyTween = tween as any;

            const orgCallback = anyTween['_onCompleteCallback'];

            anyTween.onComplete((obj: TweenObject) => {
                if (orgCallback)
                    orgCallback();
                _this.startPosition = obj.pos;
                _this.currTween=_this.nextTween;
                resolve();
            });

            if (_this.currTween && _this.currTween.isPlaying()) {
                _this.currTween.chain(tween);
                _this.nextTween=tween;
            } else {
                _this.currTween = tween;
                _this.currTween.start();
            }
        });
    }

    private async cameraTweenAlongCurve(curve: Readonly<Curve<Vector3>>, position: number, time: number) {

        const _this = this;

        const obj: TweenObject = { t: 0, pos: _this.startPosition }

        const tween = new TWEEN.Tween(obj)
            .to({ t: 0, pos: position }, time)
            .onUpdate((tween) => {
                _this.camera.position.copy(curve.getPoint(tween.pos));
                _this.camera.lookAt(_this.origin);
            })
            .easing(TWEEN.Easing.Cubic.InOut);

        this.chainTweens(tween).then(() => {
            // console.log("promise resolved")
        });
    }



    private cameraTweenLook(viewFromPoint: Readonly<Vector3>,
        lookAtPoint: Readonly<Vector3>, time: number,
        easingFun: (amount: number) => number) {

        const endQuaternion = CameraUtils.calcCameraQuaternionLookAt(this.camera, viewFromPoint, lookAtPoint)
        this.tweenCameraQuaternion(time, endQuaternion, easingFun);
    }

    private tweenCameraRotation(angle: number, axis: Vector3, time: number, easingFun: (amount: number) => number) {

        const endQuaternion = CameraUtils.calcCameraQuaternionRotateOnAxis(this.camera, axis, angle)
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
            // console.log("promise received")
        })
    }

    public moveCameraAlongSplineAndLean(curve: Readonly<Curve<Vector3>>, startPosition: number, endPosition: number, time: number, leanAngle: number) {

        const endQuaternion = CameraUtils.calcCameraQuaternionLookAt(this.camera, curve.getPoint(endPosition), this.origin, leanAngle)

        // Tween
        let part: TweenObject = { t: 0, pos: 0 };
        let startQuat: Quaternion;
        let calcQuat = new Quaternion();
        let posDirection: number;
        let startPos: number;

        const newTween = new TWEEN.Tween(part)
            .onStart((tween) => {
                startQuat = new Quaternion().copy(this.camera.quaternion);// src quaternion
                startPos = this.startPosition;
                posDirection = endPosition - this.startPosition;
            })
            .to({ t: 1, pos: endPosition }, time)
            .onUpdate((tween) => {
                let destPos = startPos + tween.t * posDirection;
                destPos = destPos < 0 ? 0 : (destPos > 1 ? 1 : destPos);
                this.camera.position.copy(curve.getPoint(destPos));
                calcQuat.slerpQuaternions(startQuat, endQuaternion, tween.t)
                this.camera.quaternion.copy(calcQuat);
            })
            .easing(TWEEN.Easing.Cubic.InOut);

        this.chainTweens(newTween).then(() => {
            this.setPanCameraConstants();
        });

    }


    static rounded2(val: number): number {
        return (Math.round((val) * 100)) / 100;
    }

    static calcCameraQuaternionLookAt(_camera: Readonly<Camera>, endPosition: Vector3, lookAtVector: Vector3, leanAngle?: number): Quaternion {
        const camera: Camera = _camera.clone();
        // backup original rotation and position
        const startQuaternion = new Quaternion().copy(camera.quaternion);
        const startPosition = new Vector3().copy(camera.position);
        // move and rotate (with lookAt + lean)
        camera.position.copy(endPosition);
        camera.lookAt(lookAtVector);
        if (leanAngle)
            camera.rotateY(leanAngle);
        //save quaternion
        return new Quaternion().copy(camera.quaternion);
    }

    static calcCameraQuaternionRotateOnAxis(_camera: Readonly<Camera>, axis: Vector3, angle: number): Quaternion {
        const camera: Camera = _camera.clone();
        // backup original rotation and position
        const startQuaternion = new Quaternion().copy(camera.quaternion);
        const startPosition = new Vector3().copy(camera.position);
        // move and rotate 
        camera.rotateOnAxis(axis, angle);
        //save quaternion
        return new Quaternion().copy(camera.quaternion);
    }


    static calcSplinePoints(spline: CatmullRomCurve3, marks: boolean[]): number[] {
        const points: number[] = [];
        const distance: number[] = [];
        const grain = 1000;

        //initialize points
        marks.forEach(element => {
            points.push(0);
            distance.push(Number.MAX_VALUE)
        });


        for (let index = 0; index <= grain; index++) {
            const curvePoint = spline.getPointAt(index * 1 / grain);

            for (let index2 = 0; index2 < spline.points.length; index2++) {
                const currDistance = spline.points[index2].distanceTo(curvePoint);
                if (currDistance < distance[index2]) {
                    distance[index2] = currDistance;
                    points[index2] = index / grain;
                }
            }
        }

        return points.filter((val, idx) => {
            return marks[idx];
        });
    }


    private setPanCameraConstants() {
        this.camera.updateWorldMatrix(false, false);
        this.cameraCenter.copy(this.camera.position);

        let right = new Vector3(1, 0, 0);
        this.camera.localToWorld(right)
        right.sub(this.cameraCenter);
        right.normalize();
        this.sideVector.copy(right);

        let up = new Vector3(0, 1, 0);
        this.camera.localToWorld(up)
        up.sub(this.cameraCenter);
        up.normalize();
        this.upVector.copy(up);

        this.camera.getWorldDirection(this.cameraDir);
        this.cameraDir.normalize();
        const dist = this.camera.position.distanceTo(this.origin);
        this.cameraLookAt.copy(this.camera.position).addScaledVector(this.cameraDir, dist);
    }


    private panCamera(mouse: Vector2) {
        this.dirVector.subVectors(this.camera.position, this.cameraCenter);
        this.camera.position.addScaledVector(this.sideVector, CameraUtils.calcCameraPan(mouse.x, this.sideVector.dot(this.dirVector)));
        this.camera.position.addScaledVector(this.upVector, CameraUtils.calcCameraPan(mouse.y, this.upVector.dot(this.dirVector)));
    }

    static calcCameraPan(mouse: number, distance: number): number {
        const sign = Math.sign(mouse);
        let inertia = distance / (cameraPanLimit * 2);
        inertia = inertia < -1 ? -1 : inertia > 1 ? 1 : inertia;
        return mouse * deltaPos * Math.abs(sign - inertia);
    }

    render(mouse: Vector2) {
        if (this.panEnabled && !this.currTween?.isPlaying())
            this.panCamera(mouse);
    }

    public setPositionAndTarget(position: Vector3, target?: Vector3) {
        this.camera.position.copy(position);
        if (target) {
            this.camera.lookAt(target);
        }
        this.setPanCameraConstants();
    }

    arrowHelper: ArrowHelper | undefined;


    public calcCameraRotationSpeed(): { horizontalFactor: number, verticalFactor: number } {
        let horizontalFactor = 0;
        let verticalFactor = 0;

        if (this.currTween?.isPlaying() || this.orbitControls.enabled) {
            this.camera.updateWorldMatrix(false, false);
            this.currentCameraPos.copy(this.camera.position);

            this.upVector.set(0, 1, 0);
            this.camera.localToWorld(this.upVector)
            this.upVector.sub(this.currentCameraPos);
            this.upVector.normalize();

            this.sideVector.set(1, 0, 0);
            this.camera.localToWorld(this.sideVector)
            this.sideVector.sub(this.currentCameraPos);
            this.sideVector.normalize();

            this.dirVector.subVectors(this.currentCameraPos, this.lastPos);
            horizontalFactor = -this.sideVector.dot(this.dirVector);
            verticalFactor = this.upVector.dot(this.dirVector);
            this.lastPos.copy(this.currentCameraPos);

            console.log(horizontalFactor, verticalFactor)
        }
        
        return { horizontalFactor: horizontalFactor, verticalFactor: verticalFactor }
    }

}