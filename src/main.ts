// CHECK index.html

import './style.css';
import './loader.css';
import './chevron.scss';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import Stats from 'stats.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, Vector2 } from 'three';
import { CameraUtils } from './CameraUtils';
import { DirectionAngles, SolarSystem } from './SolarSystem';

import { Universe } from './Universe';
import { Stars } from './Stars';
import { MagneticField } from './MagneticField';
import { Nebula } from './Nebula';
import { ScrollbarUtils } from './ScrollbarUtils';

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

export const DEFAULT_UNIVERSE_SIZE = 4000;

const universeSize = 4000;
const universeFactor = universeSize / DEFAULT_UNIVERSE_SIZE;
const solarSize = universeSize / 20;
const solarCenter: Vector3 = new Vector3(0, 0, 0);

const startDate = new Date().getTime();

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
renderer.shadowMap.enabled = false;


const stats = new Stats();
stats.showPanel(0);
document.querySelector('#main')!.appendChild(stats.dom);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = true;
controls.rotateSpeed = 0.2;
// controls.autoRotate=true;


//CameraUtils - tweens, camera path
const cameraSplineDefinition: { vector: Vector3, mark: boolean }[] = [
    { vector: new THREE.Vector3(-1000, 250, 900).multiplyScalar(universeFactor), mark: true },
    { vector: new THREE.Vector3(400, 200, 900).multiplyScalar(universeFactor), mark: true },
    { vector: new THREE.Vector3(800, 200, -500).multiplyScalar(universeFactor), mark: false },
    { vector: new THREE.Vector3(0, 200, -800).multiplyScalar(universeFactor), mark: true },
    { vector: new THREE.Vector3(-800, 400, 10).multiplyScalar(universeFactor), mark: false },
    { vector: new THREE.Vector3(-400, 600, 600).multiplyScalar(universeFactor), mark: true },
    { vector: new THREE.Vector3(-1000, 100, 0).multiplyScalar(universeFactor), mark: true },
    { vector: new THREE.Vector3(100, 600, 500).multiplyScalar(universeFactor), mark: true },
    { vector: new THREE.Vector3(1000, 700, 700).multiplyScalar(universeFactor), mark: true }
];

let cameraUtils = new CameraUtils(camera, solarCenter, controls, universeSize, cameraSplineDefinition);


//Loading big images
const loadingManager = new THREE.LoadingManager(() => {
    const loadingScreen = document.getElementById('loading-screen')!;
    const timeDiff = new Date().getTime() - startDate;
    const minDiff = 10000;
    const timeout = timeDiff >= minDiff ? 1 : minDiff - timeDiff;
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    }, timeout);
}
);



//Scrollbar and scroll handling
let scrollbarUtils = new ScrollbarUtils(main, cameraUtils);
//main.addEventListener('wheel', scrollbarUtils.checkScroll, { passive: true });

addEventListener('DOMContentLoaded', scrollbarUtils.checkScroll, false);
window.addEventListener('load', scrollbarUtils.checkScroll, false);
window.addEventListener('scroll', scrollbarUtils.checkScroll, false);
window.addEventListener('resize', scrollbarUtils.checkScroll, false);
window.addEventListener('wheel', scrollbarUtils.checkScroll, false);

window.addEventListener('scroll', scrollbarUtils.fadeOutChevron, false);
window.addEventListener('wheel', scrollbarUtils.fadeOutChevron, false);

scrollbarUtils.userIdle();

//Universe
const universe = new Universe(universeSize, loadingManager);

//Nebulas
const nebula = new Nebula(universeSize, scene, loadingManager);

//Stars
const stars = new Stars(universeSize, universeSize * 0.7, cameraUtils);

//SolarSystem
const solarSystem = new SolarSystem(solarCenter, solarSize, 800, initAngles, loadingManager);

//Magnetic field
const magneticField: MagneticField = new MagneticField(solarCenter, solarSize, 20, initAngles, renderer, camera);

//Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//Helpers

//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
// const worldAxis = new AxesHelper(100);
//scene.add(worldAxis);



//Callbacks

// let scrolled = false;
// function checkScroll() {
//     if (!scrolled) {
//         scrolled = true;
//         setTimeout(function () { scrolled = false; }, 100);
//     };
// }
// document.body.onscroll = checkScroll;;

//resize callback
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    scrollbarUtils.setScrollbarPosition(camera.aspect * 112, -200);
}
window.addEventListener('resize', onWindowResize, false);

//enable OrbitControls on ctrl+y
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'y') {
        if (main.style.visibility == "hidden") {
            main.style.visibility = "visible";
            cameraUtils.panEnabled = true;
        }
        else {
            main.style.visibility = "hidden";
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




//Add to scene
scrollbarUtils.addScrollbar(scene);
stars.addToScene(scene);
solarSystem.addToScene(scene);
solarSystem.toggleSolarSystem();
// magneticField.addToScene(scene);
nebula.addToScene(scene);
universe.addToScene(scene);


//prepare to animate
controls.target.copy(solarCenter);
cameraUtils.setPositionAndTarget(cameraSplineDefinition[0].vector, solarCenter);

// scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: "green" });


//animate loop
let clock = new THREE.Clock();
let delta = 0;
// 60 fps
let interval = 1 / 60;
animate();
function animate() {

    requestAnimationFrame(animate);
    delta += clock.getDelta();

    if (delta > interval) {
        // The draw or time dependent code are here
        render();

        delta = delta % interval;
    }
}


function render() {
    TWEEN.update();
    stats.update();
    if (controls.enabled) {
        controls.update();
    }

    //render scene
    renderer.clear();
    solarSystem.render();
    stars.render();
    //magneticField.render();
    cameraUtils.render(mouse);

    // renderer.clearDepth();
    //render rest
    renderer.render(scene, camera);
}

function onTransitionEnd(event: any) {

    const element = event.target;
    element.remove();

}


