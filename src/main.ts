// CHECK index.html

import './styles/style.css';
import './styles/loader.css';
import './styles/chevron.scss';
import { setupTypewriter } from './utils/loader.js';
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
import { Rock } from './Rock';


const initAngles: DirectionAngles = {
    alpha1: 0.3,
    alpha2: 0.4,
    beta1: 1.3,
    beta2: -0.8
}

//dont change!
export const DEFAULT_UNIVERSE_SIZE = 4000;

//this you can change
const UNIVERSE_SIZE = 4000;
const UNIVERSE_FACTOR = UNIVERSE_SIZE / DEFAULT_UNIVERSE_SIZE;
const SOLAR_SIZE = UNIVERSE_SIZE / 20;
const SOLAR_CENTER: Vector3 = new Vector3(0, 0, 0);
const MAIN_COLOR = 0xfedd1f;


const typer = document.getElementById('loader-text');
const typewriter = setupTypewriter(typer);
typewriter.type();

//Hide default scrollbar:
var main = document.getElementById('main')!;
main.style.paddingRight = main.offsetWidth - main.clientWidth + "px";
var exploreTooltip = document.getElementById('exploreTooltip')!;
exploreTooltip.style.visibility = "hidden";

//Scene
const scene: Scene = new Scene();
// scene.background = new THREE.Color( 0x666666 );
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, UNIVERSE_SIZE * 4);

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
main.parentElement!.appendChild(stats.dom);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = true;
controls.rotateSpeed = 0.2;
controls.enableRotate = false;
// controls.autoRotate=true;


//CameraUtils - tweens, camera path
const cameraSplineDefinition: { vector: Vector3, mark: boolean }[] = [
    { vector: new THREE.Vector3(-1000, 250, 900).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new THREE.Vector3(400, 200, 900).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new THREE.Vector3(800, 200, -500).multiplyScalar(UNIVERSE_FACTOR), mark: false },
    { vector: new THREE.Vector3(0, 200, -800).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new THREE.Vector3(-800, 400, 10).multiplyScalar(UNIVERSE_FACTOR), mark: false },
    { vector: new THREE.Vector3(-400, 600, 600).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new THREE.Vector3(-1000, 100, 0).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new THREE.Vector3(100, 600, 500).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new THREE.Vector3(1000, 700, 700).multiplyScalar(UNIVERSE_FACTOR), mark: true }
];

let cameraUtils = new CameraUtils(camera, SOLAR_CENTER, controls, UNIVERSE_SIZE, cameraSplineDefinition);


//Loading big images
let minDiff = 11000;
let animateRock = true;
const startDate = new Date().getTime();
const loadingManager = new THREE.LoadingManager(() => {
    const loadingScreen = document.getElementById('loading-screen')!;
    const timeDiff = new Date().getTime() - startDate;
    const timeout = timeDiff >= minDiff ? 1 : minDiff - timeDiff;
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    }, timeout);
    let animationPromise: Promise<void>;
    setTimeout(() => {
        if (animateRock) {
            animationPromise = rock.startAnimation();
        } else {
            animationPromise = Promise.resolve();
        }
        animationPromise.then(() => {
            const fadeScreen = document.getElementById('loadOverlay')!;
            fadeScreen.classList.add('fade-in-out');
            setTimeout(() => {
                var exploreLink = document.getElementById("exploreLink");
                exploreLink!.onclick = toggleExplore;
                var unExploreLink = document.getElementById("unExploreLink");
                unExploreLink!.onclick = toggleExplore;
                main.style.visibility == "visible";
                var letters = document.querySelectorAll('[id^="header"]');
                for (var i = 0; i < letters.length; i++) {
                    letters[i].classList.add('print');
                }
                fadeScreen.addEventListener('animationend', onTransitionEnd);
                prepareForSecondScene();
            }, 1000);
        });
    }, minDiff * 0.5);

});





//Rock
const rock = new Rock(UNIVERSE_SIZE, scene, loadingManager, camera);

//Universe
const universe = new Universe(UNIVERSE_SIZE, loadingManager);

//Nebulas
const nebula = new Nebula(UNIVERSE_SIZE, scene, loadingManager);

//Stars
const stars = new Stars(UNIVERSE_SIZE, UNIVERSE_SIZE * 0.7, cameraUtils);

//SolarSystem
const solarSystem = new SolarSystem(SOLAR_CENTER, SOLAR_SIZE, 800, initAngles, loadingManager);

//Magnetic field
// const magneticField: MagneticField = new MagneticField(SOLAR_CENTER, SOLAR_SIZE, 20, initAngles, renderer, camera);


//Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//Helpers

//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
// const worldAxis = new AxesHelper(100);
//scene.add(worldAxis);

//Scrollbar
let scrollbarUtils = new ScrollbarUtils(main, cameraUtils, MAIN_COLOR);


//Callbacks

//resize callback
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    scrollbarUtils.updateScrollbarPosition();
}
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('orientationchange', onWindowResize, false);


let mouse = new Vector2(0, 0);
function onDocumentMouseMove(event: any) {
    // event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
document.addEventListener('mousemove', onDocumentMouseMove, false);



let targetMouseX = 0;
document.addEventListener('mousemove', (e) => {
    targetMouseX = 2 * (e.clientX - window.innerWidth / 2) / window.innerWidth;
});

// document.addEventListener('touchmove',(e) => {
//     targetMouseX = ( e.touches[0].clientX / window.innerWidth ) * 2 - 1;
// });


//Add to scene
rock.addToScene(scene);
stars.addToScene(scene);
solarSystem.addToScene(scene);
// magneticField.addToScene(scene);
nebula.addToScene(scene);
universe.addToScene(scene);



//DEBUG
if (true) {
    cameraUtils.panEnabled = false;
    animateRock = false;
    minDiff = 10;
    //scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: "green" });
}



//prepare to animate
controls.target.copy(SOLAR_CENTER);
cameraUtils.setPositionAndTarget(cameraSplineDefinition[0].vector, SOLAR_CENTER);
cameraUtils.panEnabled = false;
main.style.visibility = "hidden";
const chev = document.getElementById('chevron')!;
// chevron.style.visibility = "hidden";


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
    rock.render(targetMouseX);
    

    // renderer.clearDepth();
    //render rest
    renderer.render(scene, camera);
    renderer.clearDepth();
    scrollbarUtils.render(renderer);
}

function onTransitionEnd(event: any) {

    const element = event.target;
    element.remove();

}

function prepareForSecondScene() {

    //Chevron
    // chevron.style.visibility = "visible";


    //Scrollbar handling
    addEventListener('DOMContentLoaded', scrollbarUtils.checkScroll, false);
    window.addEventListener('load', scrollbarUtils.checkScroll, false);
    window.addEventListener('scroll', scrollbarUtils.checkScroll, false);
    window.addEventListener('resize', scrollbarUtils.checkScroll, false);
    window.addEventListener('wheel', scrollbarUtils.checkScroll, false);
    window.addEventListener('touchmove', scrollbarUtils.checkScroll, false);

    scrollbarUtils.userIdle();
    scrollbarUtils.addScrollbar();

    //enable OrbitControls on ctrl+y
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'y') {
            toggleExplore();
        }
    });



    //Scene setup
    main.style.visibility = "visible";
    cameraUtils.setPositionAndTarget(cameraSplineDefinition[0].vector, SOLAR_CENTER);
    cameraUtils.panEnabled = true;
    controls.enableRotate = true;

    solarSystem.toggleVisibility();
    nebula.toggleVisibility();
    rock.toggleVisibility();    
}

function toggleExplore(){
    if (main.style.visibility == "hidden") {
        main.style.visibility = "visible";
        cameraUtils.panEnabled = true;
        exploreTooltip.style.visibility = "hidden";
    }
    else {
        main.style.visibility = "hidden";
        cameraUtils.panEnabled = false;
        exploreTooltip.style.visibility = "visible";
    }
    return false;
}


