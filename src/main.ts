import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { GreetingBox } from './GreetingBox'
import Stats from 'stats.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, PointLight, QuadraticBezierCurve3, AxesHelper, Fog, Color, FogExp2, Float32BufferAttribute, PointsMaterial, Object3D, AmbientLight, OrthographicCamera, Vector2, Spherical } from 'three';
import { cameraTweenLook, cameraTweenToPosAtCurve } from './cameraUtils';
import { SolarSystem } from './SolarSystem';
// @ts-ignore
//import * as POSTPROCESSING from "postprocessing";

import { Universe } from './Universe';
import { Stars } from './Stars';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';



enum AllLayers{
    stars=1,
    universe,
    solarSystem
}

export interface Rot {
    rot: number;
}

//Scene
const scene: Scene = new Scene();
//scene.background = new THREE.Color( 0x666666 );
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 15000 );

camera.layers.enable(0);
camera.layers.enable(AllLayers.solarSystem);
camera.layers.enable(AllLayers.universe);
camera.layers.enable(AllLayers.stars);
const cameraPivot = new Object3D();


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

const renderPass = new RenderPass( scene, camera );




//renderer.toneMapping = THREE.ReinhardToneMapping;
//renderer.toneMapping = THREE.CineonToneMapping;

const stats = new Stats();
stats.showPanel( 0 );
document.querySelector('#main')!.appendChild( stats.dom ); 

//GreetingBox
//const box = new GreetingBox();
//box.addToScene(scene);

//camera away from orbit control
camera.position.z = 10;


//Universe
const universe = new Universe(4000);
//universe.addNebulaToScene(scene);

const stars = new Stars(2000,200,AllLayers.stars,renderer,renderPass,camera,scene);
stars.addStarsToScene(scene);


//SolarSystem
const solarCenter: Vector3 = new Vector3(0, 0, 0);
const solarSize: number = 200;
const solarSystem = new SolarSystem(solarCenter, solarSize, 800);
//solarSystem.addToScene(scene);


//Lights
const pointLight = new PointLight(0xFFFFFF);
//const pointLightHelper = new PointLightHelper(pointLight);
pointLight.position.set(0, 0, 200);

//Helpers
const controls = new OrbitControls(camera, renderer.domElement);;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.2;
//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
//scene.add(pointLightHelper);
const ambientLight = new THREE.AmbientLight(0xffffff,0.5);
scene.add(ambientLight);
//scene.add(pointLight);

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

//solarSystem.toggleSolarSystem();
controls.target.copy(solarCenter);
camera.position.copy(new Vector3(solarSize * 4,solarSize,0));
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

    //camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);



var timer ;
const vector3 = new Vector3();
let lastHorizontal = controls.getAzimuthalAngle();
let lastVertical = controls.getPolarAngle();
let lastAngle = 0;
let horizontalFactor=0;
let verticalFactor=0;
//stars.render(renderer,0.0001,0,0.0001,new Spherical(1,0,0));
let rotationVector = new Vector2();
let rotationVectorSpherical = new Spherical();
let sync=false;
let rotationChange:Rot={rot:0};

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
    stats.update();


    //render scene
    renderer.clear();
    
    universe.render();
    solarSystem.render();
    horizontalFactor=(controls.getAzimuthalAngle()-lastHorizontal);
    verticalFactor=(controls.getPolarAngle()-lastVertical);

    rotationVector.set(horizontalFactor,verticalFactor).normalize();
    rotationVectorSpherical.set(1,horizontalFactor,verticalFactor)
    const rotationAngle = -Math.atan2(verticalFactor,horizontalFactor);

    rotationChange.rot = rotationAngle;
    //rotationChange.rot = rotationAngle;

    const scaleFactor = Math.max(Math.abs(horizontalFactor),Math.abs(verticalFactor))
    if(scaleFactor>0.001){
        if(rotationChange.rot<0.1 && rotationChange.rot>-0.1)
            sync=true;
        console.log(rotationChange.rot * (180/Math.PI),rotationAngle* (180/Math.PI),lastAngle);
        stars.render(renderer,horizontalFactor,verticalFactor,scaleFactor,rotationChange,sync);
    }
    
    renderer.render(scene,camera);
    
    //tiltCamera();

    lastHorizontal = controls.getAzimuthalAngle();
    lastVertical = controls.getPolarAngle();
    lastAngle = rotationAngle;
    sync=false;
}
animate();


function tiltCamera(){
    timer = new Date().getTime()*0.0005;
    camera.position.add(new Vector3(Math.cos( timer )*0.1,0,0));
    camera.position.add(new Vector3(0,Math.sin( timer )*0.2,0));
    camera.lookAt(solarCenter);
}