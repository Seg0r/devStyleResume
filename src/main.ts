import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { GreetingBox } from './GreetingBox'
//import Stats from 'stats.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, PointLight, QuadraticBezierCurve3, AxesHelper, Fog, Color, FogExp2, Float32BufferAttribute, PointsMaterial, Object3D, AmbientLight } from 'three';
import { cameraTweenLook, cameraTweenToPosAtCurve } from './cameraUtils';
import { SolarSystem } from './SolarSystem';
// @ts-ignore
//import * as POSTPROCESSING from "postprocessing";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Universe } from './Universe';

//Scene
const scene: Scene = new Scene();
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.layers.enable(0);
camera.layers.enable(1);
const cameraPivot = new Object3D();


const renderer = new WebGLRenderer({
    canvas: document.querySelector('#bg') as HTMLCanvasElement
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.toneMapping = THREE.ReinhardToneMapping;
//renderer.toneMapping = THREE.CineonToneMapping;

/* const stats = new Stats();
stats.showPanel( 0 );
document.querySelector('#main')!.appendChild( stats.dom ); */

//GreetingBox
//const box = new GreetingBox();
//box.addToScene(scene);

//camera away from orbit control
camera.position.z = 10;


const starsLayer = 1
//Universe
const universe = new Universe(2000,1000,starsLayer,renderer,scene,camera);
universe.addNebulaToScene(scene);
universe.addStarsToScene(scene);


//SolarSystem
const solarCenter: Vector3 = new Vector3(0, 0, 0);
const solarSize: number = 200;
const solarSystem = new SolarSystem(solarCenter, solarSize, 800);
solarSystem.addToScene(scene);


//Lights
const pointLight = new PointLight(0xFFFFFF);
//const pointLightHelper = new PointLightHelper(pointLight);
pointLight.position.set(0, 0, 200);

//Helpers
const controls = new OrbitControls(camera, renderer.domElement);;
//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
//scene.add(pointLightHelper);
const ambientLight = new THREE.AmbientLight(0xffffff,0.5);
scene.add(ambientLight);
//scene.add(pointLight);

//const worldAxis = new AxesHelper(100);
//scene.add(worldAxis);


//Camera positions
// const cameraBoxPos = new Vector3(0, 0, 15);
// const cameraSolarPos = new Vector3(400, -150, 100);

// const curveToSolar = new QuadraticBezierCurve3(
//     cameraBoxPos,
//     new Vector3(300, -200, 400),
//     cameraSolarPos
// );

// const curveFromSolar = new QuadraticBezierCurve3(
//     cameraSolarPos,
//     new Vector3(300, -200, 400),
//     cameraBoxPos
// );

/* const points = curveToSolar.getPoints( 500 );
const geometry = new BufferGeometry().setFromPoints( points );
const material = new LineBasicMaterial( { color : 0xff0000 } );
const curveObject = new Line( geometry, material );
scene.add(curveObject); */


// const cameraLookAtPoint = new Vector3(700, -100, 0);


//First render
//camera.position.copy(cameraBoxPos);
//renderer.render(scene, camera);

// const storyStage = {
//     stage0: 0,
//     stage1: 1,
//     stage2: 2,
//     stage3: 3,
// }

// let currentStory: number = storyStage.stage0;



//scroll callback
// function tellTheStory() {
//     const main: HTMLElement = document.getElementById("main")!;
//     const currOffsetPerc: number = Math.round(document.body.getBoundingClientRect().top / main.offsetHeight * -100)

//     console.log(currOffsetPerc);

//     if (currOffsetPerc < 20) {
//         if (currentStory != storyStage.stage0) {
//             currentStory = storyStage.stage0;
//             //cameraTweenToPos(camera, curveToSolar.getPoint(0),3000);
//             cameraTweenToPosAtCurve(camera, curveFromSolar, 5000);
//             cameraTweenLook(camera, cameraBoxPos, box.getPosition(), 8000, TWEEN.Easing.Linear.None);
//             console.log("Pierwsza animacja");
//         }
//         box.animateBox(currOffsetPerc, 0, 20);
//     }
//     else if (currOffsetPerc >= 20 && currOffsetPerc < 40) {
//         if (currentStory != storyStage.stage1) {
//             currentStory = storyStage.stage1;
//             //cameraTweenToPos(camera, curveToSolar.getPoint(1),3000);
//             cameraTweenToPosAtCurve(camera, curveToSolar, 5000);
//             cameraTweenLook(camera, curveToSolar.getPoint(1), cameraLookAtPoint, 8000, TWEEN.Easing.Linear.None);
//             console.log("Druga animacja");
//             solarSystem.toggleSolarSystem();
//             //controls.target.copy(solarCenter);
//         }

//     } else {
//         if (currentStory != storyStage.stage2) {
//             currentStory = storyStage.stage2;
//             console.log("Trzecia animacja");
//         }

//     }
// }

// let scrolled = false;
// function checkScroll() {
//     if (!scrolled) {
//         scrolled = true;
//         //tellTheStory();
//         setTimeout(function () { scrolled = false; }, 100);
//     };
// }
// document.body.onscroll = checkScroll;;

solarSystem.toggleSolarSystem();
controls.target.copy(solarCenter);
camera.position.copy(new Vector3(0,solarSize,solarSize * 5).add(solarCenter));
cameraPivot.add(camera);

// camera.position.add(new Vector3(250, 250, 500));


// controls.target.copy(solarCenter.add(new Vector3(800,0,0)));
// camera.position.copy(new Vector3(50,50,50).add(solarCenter));
// const geo = solarSystem.generateGeometry(10);
// const edges = new THREE.EdgesGeometry( geo );
// const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
// line.position.copy(solarCenter);
// scene.add( line );
//const material = 


//resize callback
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}
window.addEventListener('resize', onWindowResize, false);


renderer.autoClear = false;

//animate loop
function animate() {
    // cloudParticles.forEach(p => {
    //     p.rotation.z -=0.001;
    //   });
    //camera.position.add(new Vector3(0, 0.1, 0))
    //camera.lookAt(new Vector3(0, 0, 0))
    //middle.rotateOnWorldAxis(new Vector3(1,0,0),0.1)
    // starParticles.forEach(p => {
    //     p.rotation.z -=0.001;
    //  });
    //requestAnimationFrame(animate);
    //setTimeout( function() {
    requestAnimationFrame(animate);
    //}, 5 );
    //GreetingBox.updateTweens();
    TWEEN.update()
    controls.update(); 
    //stats.update();


    //render scene
    renderer.clear();
    universe.render();
    renderer.render(scene,camera)
    solarSystem.renderSolarSystem();

    var timer = new Date().getTime()*0.0005; 
    camera.position.add(new Vector3(Math.cos( timer )*0.1,0,0));
    camera.position.add(new Vector3(0,Math.sin( timer )*0.2,0));
    camera.lookAt(solarCenter);
}
animate();
