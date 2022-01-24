import * as TWEEN from '@tweenjs/tween.js';
import { Vector3, Quaternion, PerspectiveCamera, Camera, Curve, CatmullRomCurve3, Vector2, ArrowHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DEFAULT_UNIVERSE_SIZE } from './main';


interface TweenObject {
    t: number;
    pos: number
}

declare type UnknownProps = Record<string, any>;
declare type SplineDef = { vector: Vector3, mark: boolean }[]

export class CameraUtils {

    camera: PerspectiveCamera;
    timer: number = 0;
    vector = new Vector3;
    moving: boolean = false;
    currTweenV3: TWEEN.Tween<Vector3> | undefined;

    currTween: TWEEN.Tween<UnknownProps> | undefined;
    nextTween: TWEEN.Tween<UnknownProps> | undefined;
    origin: Vector3;
    yAxis = new Vector3(0, 1, 0);
    startPosition: number = 0;

    prevSplinePoint = 0
    cameraSplineVectors: number[] = [];
    cameraSpline: CatmullRomCurve3 ;

    //camera pan variables
    cameraCenter = new Vector3();
    mouse = new Vector2(0, 0);
    private _panEnabled: boolean = true;
    cameraDir: Vector3 = new Vector3();
    private _cameraLookAt = new Vector3();
    private cameraPanLimit = 30;
    private deltaPos = 5;

    //camera rotation factors
    lastPos = new Vector3();
    currentCameraPos: Vector3 = new Vector3();

    //pan and rotation variables
    sideVector = new Vector3();
    upVector = new Vector3();
    dirVector = new Vector3();
    orbitControls: OrbitControls;
    horizontalAngle: number = 0;
    verticalAngle: number = 0;
    universeFactor: number;

    



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


    constructor(camera: PerspectiveCamera, origin: Vector3, controls: OrbitControls, universeSize: number, cameraSplineDefinition:SplineDef) {
        this.camera = camera;
        this.origin = origin;
        this.camera.lookAt(origin);
        this.setPanCameraConstants();
        this.orbitControls = controls;
        this.cameraPanLimit = universeSize/160;
        this.deltaPos = universeSize/800;
        this.universeFactor = DEFAULT_UNIVERSE_SIZE/universeSize;
        const calcSpline = this.calcSplinePoints(cameraSplineDefinition);
        this.cameraSpline = calcSpline.curve;
        this.cameraSplineVectors = calcSpline.vectors;
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
                _this.currTween = _this.nextTween;
                resolve();
            });

            if (_this.currTween && _this.currTween.isPlaying()) {
                _this.currTween.chain(tween);
                _this.nextTween = tween;
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

        const endQuaternion = CameraUtils.calcCameraLookAtQuaternion(this.camera, viewFromPoint, lookAtPoint)
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

    public moveCameraAlongSplineAndLean(section: number, time: number, leanAngle: number) {

        
        let splinePoint = this.cameraSplineVectors[section]
       
        // Tween
        let part: TweenObject = { t: 0, pos: 0 };
        let startQuat: Quaternion;
        let calcQuat = new Quaternion();
        let endQuaternion = new Quaternion();
        let posDirection: number;
        let startPos: number;
        let currentVector = new Vector3();
        let currentTarget = new Vector3();
        let endTarget = new Vector3();

        const newTween = new TWEEN.Tween(part)
            .onStart((tween) => {
                startQuat = new Quaternion().copy(this.camera.quaternion);// src quaternion
                startPos = this.startPosition;
                posDirection = splinePoint - this.startPosition;
                currentVector.copy(this.camera.position);
                currentTarget.copy(this.orbitControls.target);
                // endQuaternion.copy(CameraUtils.calcCameraLookAtQuaternion(this.camera, curve.getPoint(endPosition), this.origin, leanAngle));
                endTarget.copy(CameraUtils.calcCameraLookAtVector3(this.camera,this.cameraSpline.getPoint(splinePoint), this.origin, leanAngle));
            })
            .to({ t: 1, pos: splinePoint }, time)
            .onUpdate((tween) => {
                let destPos = startPos + tween.t * posDirection;
                destPos = destPos < 0 ? 0 : (destPos > 1 ? 1 : destPos);
                currentVector.lerp(this.cameraSpline.getPoint(destPos),tween.t);
                this.camera.position.copy(currentVector);
                currentTarget.lerp(endTarget,tween.t);
                this.orbitControls.target.copy(currentTarget);
                // calcQuat.slerpQuaternions(startQuat, endQuaternion, tween.t)
                // this.camera.quaternion.copy(calcQuat);
            })
            .easing(TWEEN.Easing.Cubic.InOut);

        this.chainTweens(newTween).then(() => {
            this.setPanCameraConstants();
        });

    }


    static rounded2(val: number): number {
        return (Math.round((val) * 100)) / 100;
    }

    static calcCameraLookAtQuaternion(_camera: Readonly<Camera>, endPosition: Vector3, lookAtVector: Vector3, leanAngle?: number): Quaternion {
        const camera: Camera = _camera.clone();
        // move and rotate (with lookAt + lean)
        camera.position.copy(endPosition);
        camera.lookAt(lookAtVector);
        if (leanAngle)
            camera.rotateY(leanAngle);
        //save quaternion
        return new Quaternion().copy(camera.quaternion);
    }

    static calcCameraLookAtVector3(_camera: Readonly<Camera>, endPosition: Vector3, lookAtVector: Vector3, leanAngle?: number): Vector3 {
        const camera: Camera = _camera.clone();
        // move and rotate (with lookAt + lean)
        camera.position.copy(endPosition);
        camera.lookAt(lookAtVector);
        const dist = camera.position.distanceTo(lookAtVector);

        if (leanAngle)
            camera.rotateY(leanAngle);

        let vLeaned = new Vector3(0, 0, -1).applyEuler(camera.rotation).setLength(dist);

        vLeaned = new Vector3().add(camera.position).add(vLeaned);
       
        return vLeaned;
    }

    static calcCameraQuaternionRotateOnAxis(_camera: Readonly<Camera>, axis: Vector3, angle: number): Quaternion {
        const camera: Camera = _camera.clone();
        // move and rotate 
        camera.rotateOnAxis(axis, angle);
        //save quaternion
        return new Quaternion().copy(camera.quaternion);
    }


    public calcSplinePoints(splineDef: SplineDef): {curve: CatmullRomCurve3, vectors:any}  {

        const cameraSpline = new CatmullRomCurve3(splineDef.map(a => a.vector));
        const marks = splineDef.map(a => a.mark)

        const points: number[] = [];
        const distance: number[] = [];
        const grain = 1000;

        //initialize points
        marks.forEach(element => {
            points.push(0);
            distance.push(Number.MAX_VALUE)
        });


        for (let index = 0; index <= grain; index++) {
            const curvePoint = cameraSpline.getPointAt(index * 1 / grain);

            for (let index2 = 0; index2 < cameraSpline.points.length; index2++) {
                const currDistance = cameraSpline.points[index2].distanceTo(curvePoint);
                if (currDistance < distance[index2]) {
                    distance[index2] = currDistance;
                    points[index2] = index / grain;
                }
            }
        }

        const cameraSplineVectors = points.filter((val, idx) => {
            return marks[idx];
        });

        return {curve:cameraSpline, vectors: cameraSplineVectors};
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
        this.camera.position.addScaledVector(this.sideVector, this.calcCameraPan(mouse.x, this.sideVector.dot(this.dirVector)));
        this.camera.position.addScaledVector(this.upVector, this.calcCameraPan(mouse.y, this.upVector.dot(this.dirVector)));
    }

    private calcCameraPan(mouse: number, distance: number): number {
        const sign = Math.sign(mouse);
        let inertia = distance / (this.cameraPanLimit * 2);
        inertia = inertia < -1 ? -1 : inertia > 1 ? 1 : inertia;
        return mouse * this.deltaPos * Math.abs(sign - inertia);
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

        if (this.currTween?.isPlaying() || !this.panEnabled) {

            // Calculating camera position change without orbit controls
            // this.camera.updateWorldMatrix(false, false);
            // this.currentCameraPos.copy(this.camera.position);

            // this.upVector.set(0, 1, 0);
            // this.camera.localToWorld(this.upVector)
            // this.upVector.sub(this.currentCameraPos);
            // this.upVector.normalize();

            // this.sideVector.set(1, 0, 0);
            // this.camera.localToWorld(this.sideVector);
            // this.sideVector.sub(this.currentCameraPos);
            // this.sideVector.normalize();

            // this.dirVector.subVectors(this.currentCameraPos, this.lastPos);
            // horizontalFactor = -this.sideVector.dot(this.dirVector)/this.sideVector.length();
            // verticalFactor = this.upVector.dot(this.dirVector)/this.sideVector.length();
            // this.lastPos.copy(this.currentCameraPos);

            // horizontalFactor*=this.universeFactor;
            // verticalFactor*=this.universeFactor;
            // horizontalFactor/=500;
            // verticalFactor/=500;
            //console.log(horizontalFactor,verticalFactor)

            //Orbit controls easy way
            horizontalFactor=this.horizontalAngle-this.orbitControls.getAzimuthalAngle();
            verticalFactor=this.verticalAngle-this.orbitControls.getPolarAngle();
            this.horizontalAngle=this.orbitControls.getAzimuthalAngle()
            this.verticalAngle=this.orbitControls.getPolarAngle();
        }

        return { horizontalFactor: horizontalFactor, verticalFactor: verticalFactor }
    }


    



}