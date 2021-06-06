import * as TWEEN from '@tweenjs/tween.js';
import { Vector3, QuadraticBezierCurve3, Quaternion, PerspectiveCamera, Camera } from 'three';

//camera tweens
export function cameraTweenToPos(camera: Readonly<PerspectiveCamera>, cameraPos: Readonly<Vector3>, time: number) {

    new TWEEN.Tween(camera.position)
        .to(cameraPos, time)
        .easing(TWEEN.Easing.Quartic.InOut)
        .start();
}

export function cameraTweenToPosAtCurve(camera: Readonly<PerspectiveCamera>,curve: Readonly<QuadraticBezierCurve3>, time: number) {

    let part = { p: 0 };

    new TWEEN.Tween(part)
        .to({ p: 1 }, time)
        .onUpdate((tween) => {
            camera.position.copy(curve.getPoint(tween.p));
        })
        .easing(TWEEN.Easing.Quartic.InOut)
        .start();
}

export function cameraTweenLook(camera: Readonly<Camera>, viewFromPoint: Readonly<Vector3>, lookAtPoint: Readonly<Vector3>, time: number) {
    // backup original rotation
    const startQuaternion = new Quaternion().copy(camera.quaternion);
    // final rotation (with lookAt)
    const startPosition = new Vector3().copy(camera.position);
    camera.position.copy(viewFromPoint);
    camera.lookAt(lookAtPoint);
    const endQuaternion = new Quaternion().copy(camera.quaternion);
    // revert to original rotation
    camera.quaternion.copy(startQuaternion);
    camera.position.copy(startPosition);
    // Tween
    let part = {t: 0};
    
    new TWEEN.Tween(part)
    .to({t: 1}, time)
    .onUpdate((tween) => {
        camera.quaternion.slerp(endQuaternion,tween.t);
    })
    .easing(TWEEN.Easing.Quartic.In)
    .start();
}
