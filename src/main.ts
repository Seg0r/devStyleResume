import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { GreetingBox } from './GreetingBox'
import Stats from 'stats.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, PointLight, QuadraticBezierCurve3, AxesHelper, Fog, Color, FogExp2, Float32BufferAttribute, PointsMaterial, Object3D, AmbientLight, OrthographicCamera, Vector2, Spherical, Camera } from 'three';
import { CameraUtils } from './CameraUtils';
import { DirectionAngles, SolarSystem } from './SolarSystem';
// @ts-ignore
//import * as POSTPROCESSING from "postprocessing";

import { Universe } from './Universe';
import { Stars } from './Stars';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { MagneticField } from './MagneticField';
import { Nebula } from './Nebula';


const alpha1 = 0.3;
const alpha2 = 0.4;
const beta1 = 1.3;
const beta2 = -0.8;

const initAngles: DirectionAngles = {
    alpha1: alpha1,
    alpha2: alpha2,
    beta1: beta1,
    beta2: beta2
}


const universeSize = 4000;
const solarSize = universeSize / 20;
const solarCenter: Vector3 = new Vector3(0, 0, 0);

//Hide scrollbar:
var main = document.getElementById('main')!;
if (main)
    main.style.paddingRight = main.offsetWidth - main.clientWidth + "px";


//Scene
const scene: Scene = new Scene();
// scene.background = new THREE.Color( 0x666666 );
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, universeSize * 4);


//Renderer
const renderer = new WebGLRenderer({
    canvas: document.querySelector('#bg') as HTMLCanvasElement,
    alpha: false,
    stencil: false,
    powerPreference: "high-performance",
    antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;


const stats = new Stats();
stats.showPanel(0);
document.querySelector('#main')!.appendChild(stats.dom);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.2;
controls.enabled = false;
// controls.autoRotate=true;

//GreetingBox
//const box = new GreetingBox();
//box.addToScene(scene);

//camera away from orbit control
let cameraUtils = new CameraUtils(camera, solarCenter,controls,main);

const cameraSplineDefinition: { vector: Vector3, mark: boolean }[] = [
    { vector: new THREE.Vector3(-1000, 250, 900), mark: true },
    { vector: new THREE.Vector3(400, 200, 900), mark: true },
    { vector: new THREE.Vector3(800, 200, -500), mark: false },
    { vector: new THREE.Vector3(0, 200, -800), mark: true },
    { vector: new THREE.Vector3(-800, 400, 10), mark: false },
    { vector: new THREE.Vector3(-400, 600, 600), mark: true },
    { vector: new THREE.Vector3(-1000, 100, 0), mark: true },
    { vector: new THREE.Vector3(100, 600, 500), mark: true },
    { vector: new THREE.Vector3(1000, 700, 700), mark: true }
];

cameraUtils.calcSplinePoints(cameraSplineDefinition);
main.addEventListener('wheel', cameraUtils.checkScroll, { passive: true });


//Universe
const universe = new Universe(universeSize);

//Nebulas
const nebula = new Nebula(universeSize, universeSize / 4, scene);

//Stars
const stars = new Stars(universeSize, universeSize * 0.7, cameraUtils);

//SolarSystem
const solarSystem = new SolarSystem(solarCenter, solarSize, 800, initAngles);

//Magnetic field
const magneticField: MagneticField = new MagneticField(solarCenter, solarSize, 20, initAngles, renderer, camera);


//Add to scene
universe.addToScene(scene);
stars.addToScene(scene);
solarSystem.addToScene(scene);
solarSystem.toggleSolarSystem();
//magneticField.addToScene(scene);
nebula.addToScene(scene);


//Lights
const pointLight = new PointLight(0xFFFFFF);
//const pointLightHelper = new PointLightHelper(pointLight);
pointLight.position.set(0, 0, 200);

//Helpers

//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
//scene.add(pointLightHelper);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
//scene.add(pointLight);
cameraUtils.addScrollbar(scene);

const worldAxis = new AxesHelper(100);
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


controls.target.copy(solarCenter);



//resize callback
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameraUtils.setScrollbarPosition(camera.aspect*112,-200);
}
window.addEventListener('resize', onWindowResize, false);



//enable OrbitControls on ctrl+y
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'y') {
        if (main.style.visibility == "hidden") {
            main.style.visibility = "visible";
            controls.enabled = false;
            cameraUtils.panEnabled = true;
        }
        else {
            main.style.visibility = "hidden";
            controls.enabled = true;
            cameraUtils.panEnabled = false;
        }
    }
});


let mouse = new Vector2(0, 0);

function onDocumentMouseMove(event: any) {
    // event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

document.addEventListener('mousemove', onDocumentMouseMove, false);
cameraUtils.setPositionAndTarget(cameraSplineDefinition[0].vector, solarCenter);

//animate loop
animate();
function animate() {

    TWEEN.update();
    stats.update();
    if (controls.enabled) {
        controls.update();
    }

    //render scene
    renderer.clear();
    universe.render();
    solarSystem.render();
    stars.render();
    //magneticField.render();
    cameraUtils.render(mouse);

    renderer.clearDepth();

    //render rest
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}



