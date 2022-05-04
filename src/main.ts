// CHECK index.html

import './styles/style.css';
import './styles/loader.css';
import './styles/chevron.scss';
import './styles/gallery.scss';
import './styles/tooltip.scss';

// @ts-ignore 
import { setupTypewriter } from './utils/loader.js';
import { update as tweenUpdate } from '@tweenjs/tween.js';
import Stats from 'stats.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, Vector2, AmbientLight, Clock, LoadingManager, AudioListener, Audio, AudioLoader } from 'three';
import { CameraUtils } from './CameraUtils';
import { DirectionAngles, SolarSystem } from './SolarSystem';

import { Universe } from './Universe';
import { Stars } from './Stars';
// import { MagneticField } from './MagneticField';
import { Nebula } from './Nebula';
import { ScrollbarUtils } from './ScrollbarUtils';
import { Rock } from './Rock';

// @ts-ignore 
import { ScifiPopup } from './utils/ScifiPopup';
// @ts-ignore 
import { throttle } from './utils/utils';


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

/////////////////////////////////////
// 
/////////////////////////////////////
const main = document.getElementById('main')!;
var exploreTooltip = document.getElementById('exploreTooltip')!;
exploreTooltip.style.visibility = "hidden";


//Loading screen
const typer = document.getElementById('loader-text');
const typewriter = setupTypewriter(typer);
typewriter.type();

//Define popups
customElements.define('scifi-popup', ScifiPopup);


//Scene
const scene: Scene = new Scene();
// scene.background = new Color( 0x666666 );
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
// main.parentElement!.appendChild(stats.dom);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = true;
controls.rotateSpeed = 0.2;
toggleControls(false);
// controls.autoRotate=true;

//Loading big images
let minDiff = 8000;
let skipAnimateRock = false;
const startDate = new Date().getTime();
const loadingManager = new LoadingManager(() => {
    const timeDiff = new Date().getTime() - startDate;
    const timeout = timeDiff >= minDiff ? 1 : minDiff - timeDiff;
    setTimeout(() => {
        const continueButton = document.getElementById('loader-loaded')!;
        continueButton.classList.add('loaded');
    }, timeout);

    return;
});

////////////////////////////
//Sounds
///////////////////////////
const listener = new AudioListener();
camera.add(listener);
const ambienceSound = new Audio(listener);
const audioLoader = new AudioLoader(loadingManager);
audioLoader.load('sounds/ambience3.mp3', function (buffer) {
    ambienceSound.setBuffer(buffer);
    ambienceSound.setLoop(true);
    ambienceSound.setVolume(0.2);
});


//CameraUtils - tweens, camera path
const cameraSplineDefinition: { vector: Vector3, mark: boolean }[] = [
    { vector: new Vector3(-1000, 250, 900).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(400, 200, 900).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(800, 200, -500).multiplyScalar(UNIVERSE_FACTOR), mark: false },
    { vector: new Vector3(0, 200, -800).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(-800, 400, 10).multiplyScalar(UNIVERSE_FACTOR), mark: false },
    { vector: new Vector3(-400, 600, 600).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(-1000, 100, 0).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(200, 400, -200).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(1000, -200, -700).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(500, 500, 700).multiplyScalar(UNIVERSE_FACTOR), mark: true },
    { vector: new Vector3(-400, 300, 500).multiplyScalar(UNIVERSE_FACTOR), mark: true }
];

let cameraUtils = new CameraUtils(camera, SOLAR_CENTER, controls, UNIVERSE_SIZE, cameraSplineDefinition, listener);

/////////////////////////////////////
// OBJECTS
/////////////////////////////////////

//Rock
const rock = new Rock(UNIVERSE_SIZE, scene, loadingManager, camera);

//Universe
const universe = new Universe(UNIVERSE_SIZE, loadingManager);

//Nebulas
const nebula = new Nebula(UNIVERSE_SIZE, scene, loadingManager);

//Stars
const stars = new Stars(UNIVERSE_SIZE, UNIVERSE_SIZE * 0.7, cameraUtils);

//SolarSystem
const solarSystem = new SolarSystem(SOLAR_CENTER, SOLAR_SIZE, 800, initAngles, loadingManager, listener);

//Magnetic field
// const magneticField: MagneticField = new MagneticField(SOLAR_CENTER, SOLAR_SIZE, 20, initAngles, renderer, camera);


//Lights
const ambientLight = new AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//Helpers

//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
// const worldAxis = new AxesHelper(100);
//scene.add(worldAxis);

//Scrollbar
let scrollbarUtils = new ScrollbarUtils(main, cameraUtils, MAIN_COLOR,renderer);



/////////////////////////////////////
// CALLBACKS
/////////////////////////////////////
//resize callback
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    scrollbarUtils.updateScrollbarPosition();
    scrollbarUtils.scrollCurrent();
    landscapePrompt();
}
window.addEventListener('resize', throttle(onWindowResize, 50), false);
window.addEventListener('orientationchange', onWindowResize, false);

let mouse = new Vector2(0, 0);
function onDocumentMouseMove(event: any) {
    // event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
document.addEventListener('mousemove', throttle(onDocumentMouseMove, 50), false);

const loaderStart = document.getElementById("loader-start");
loaderStart!.addEventListener('click', animateIntro);

landscapePrompt();

document.addEventListener('popupOpened', scrollbarUtils.disableCheckScroll);
document.addEventListener('popupClosed', scrollbarUtils.enableCheckScroll);

tooltipListeners();


/////////////////////////////////////
//SCENE
/////////////////////////////////////
rock.addToScene(scene);
stars.addToScene(scene);
solarSystem.addToScene(scene);
// magneticField.addToScene(scene);
nebula.addToScene(scene);
universe.addToScene(scene);


//DEBUG
if (false) {
    cameraUtils.panEnabled = false;
    skipAnimateRock = true;
    minDiff = 10;
    // listener.gain.gain.value = 0;
    //scene.overrideMaterial = new MeshBasicMaterial({ color: "green" });
}


//prepare to animate
controls.target.copy(SOLAR_CENTER);
cameraUtils.setPositionAndTarget(cameraSplineDefinition[0].vector, SOLAR_CENTER);
cameraUtils.panEnabled = false;
main.style.visibility = "hidden";
//reset to top of page (sometimes needed after reload)
window.scrollTo(0, 0);


//animate loop
let clock = new Clock();
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
    tweenUpdate();
    // stats.update();
    if (controls.enabled) {
        controls.update();
    }

    //render scene
    renderer.clear();
    solarSystem.render();
    stars.render();
    //magneticField.render();
    cameraUtils.render(mouse);
    rock.render();


    // renderer.clearDepth();
    //render rest
    renderer.render(scene, camera);
    renderer.clearDepth();
    scrollbarUtils.render();
}

function onTransitionEnd(event: any) {

    const element = event.target;
    element.remove();

}

function prepareForSecondScene() {

    //Scrollbar handling
    scrollbarUtils.prepareListeners();
    scrollbarUtils.addScrollbar();

    //do not change touch behaviour until second scene
    ScifiPopup.registerOpeners();

    //enable OrbitControls on ctrl+y
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'y') {
            toggleExplore();
        }
    });

    //reset to top of page (sometimes needed after reload)
    window.scrollTo(0, 0);

    //exlore links from end of page
    const exploreLink = document.getElementById("exploreLink");
    exploreLink!.addEventListener('click', toggleExplore);
    exploreLink!.addEventListener('touchend', toggleExplore);
    const unExploreLink = document.getElementById("unExploreLink");
    unExploreLink!.addEventListener('click', toggleExplore);
    unExploreLink!.addEventListener('touchend', toggleExplore);

    //Scene setup
    main.style.visibility = "visible";
    var letters = document.querySelectorAll('[id^="header"]');
    for (var i = 0; i < letters.length; i++) {
        letters[i].classList.add('print');
    }
    cameraUtils.setPositionAndTarget(cameraSplineDefinition[0].vector, SOLAR_CENTER);
    cameraUtils.panEnabled = true;
    toggleControls(false);

    solarSystem.toggleVisibility();
    nebula.toggleVisibility();
    rock.toggleVisibility();

    //Sound
    ambienceSound.play();
    
}

function toggleExplore() {
    if (main.style.visibility == "hidden") {
        main.style.visibility = "visible";
        toggleControls(false);
        cameraUtils.panEnabled = true;
        exploreTooltip.style.visibility = "hidden";
        scrollbarUtils.enableCheckScroll();
    }
    else {
        main.style.visibility = "hidden";
        cameraUtils.panEnabled = false;
        toggleControls(true);
        exploreTooltip.style.visibility = "visible";
        scrollbarUtils.disableCheckScroll();
    }
    return false;
}


function animateIntro() {
    if (isMobile()) {
        openFullscreen();
    }
    const loadingScreen = document.getElementById('loading-screen')!;
    loadingScreen.classList.add('fade-out');
    loadingScreen.addEventListener('transitionend', onTransitionEnd);
    let animationPromise: Promise<void>;
    if (!skipAnimateRock) {
        animationPromise = rock.startAnimation();
    } else {
        animationPromise = Promise.resolve();
    }
    animationPromise.then(() => {
        const fadeScreen = document.getElementById('loadOverlay')!;
        fadeScreen.classList.add('fade-in-out');
        setTimeout(() => {
            fadeScreen.addEventListener('animationend', onTransitionEnd);
            prepareForSecondScene();
        }, 1000);
    });

    return false;
}

function landscapePrompt() {
    const loaderLandscape = document.getElementById("loader-landscape");
    if (window.innerWidth < window.innerHeight) {
        loaderLandscape?.classList.add('fadein');
        loaderLandscape?.classList.remove('fadeout');
    } else {
        //no initial fadeout
        if (loaderLandscape?.classList.contains('fadein')) {
            loaderLandscape?.classList.add('fadeout');
            loaderLandscape?.classList.remove('fadein');
        }
    }
}

function toggleControls(val: boolean) {
    controls.enableRotate = val;
    controls.enableZoom = val;
    controls.enablePan = val;
}


function openFullscreen() {
    var elem: any = window.document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

function isMobile() {
    if ("ontouchstart" in document.documentElement)
        return true;
    else
        return false;
}

function tooltipListeners() {
    const tooltipedElement = document.querySelectorAll('h1[tooltip]');
    tooltipedElement.forEach(element => {
        element.addEventListener('click',removetTooltips);
    });

    document.addEventListener('scroll',throttle(()=>{
        hideTooltip();
        setTimeout(showTooltip,3500);
    },200));
}

function removetTooltips() {
    const tooltipedElement = document.querySelectorAll('h1[tooltip]');
    tooltipedElement.forEach(element => {
        element.removeAttribute('tooltip');
        element.removeEventListener('click',removetTooltips);
    });
}

function showTooltip() {
    const tooltipedElement = document.querySelectorAll('h1[tooltip]');
    tooltipedElement.forEach(element => {
        if (!element.classList.contains('show-tooltip')) {
            element.classList.add('show-tooltip');
        }
    });
}

function hideTooltip() {
    const tooltipedElement = document.querySelectorAll('h1[tooltip]');
    tooltipedElement.forEach(element => {
        if (element.classList.contains('show-tooltip')) {
            element.classList.remove('show-tooltip');
        }
    });
}
