import './style.css'
//import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {GreetingBox} from './GreetingBox'
//import Stats from 'stats.js'

import {OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, PointLight, QuadraticBezierCurve3, BufferGeometry, LineBasicMaterial, Line, AmbientLight, AxesHelper } from 'three';
import { cameraTweenLook,  cameraTweenToPosAtCurve } from './cameraUtils';
import { SolarSystem } from './SolarSystem';

//Scene
const scene:Scene = new Scene();
export const camera = new PerspectiveCamera(60, window.innerWidth/window.innerHeight,0.1);

const renderer = new WebGLRenderer({
    canvas: document.querySelector('#bg') as HTMLCanvasElement,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);

/* var stats = new Stats();
stats.showPanel( 0 );
document.querySelector('#main')!.appendChild( stats.dom ); */

//GreetingBox
const box = new GreetingBox();
scene.add(box.greetingBox);


//SolarSystem
const solarCenter: Vector3 = new Vector3(700,-100,300);
const solarSystem = new SolarSystem(solarCenter,50, 100);
solarSystem.addToScene(scene);

//Lights
const pointLight = new PointLight(0xFFFFFF);
//const pointLightHelper = new PointLightHelper(pointLight);
pointLight.position.set(0,0,200);

const ambientLight = new AmbientLight(0xFFFFFF,0.6);

//Helpers
const controls = new OrbitControls(camera, renderer.domElement);;
//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
//scene.add(pointLightHelper);
scene.add(ambientLight);
scene.add(pointLight);

const worldAxis = new AxesHelper(100);
scene.add(worldAxis);


//Camera positions
const cameraBoxPos = new Vector3(0,0,15);
const cameraSolarPos = new Vector3(400,-150,1000);

const curveToSolar = new QuadraticBezierCurve3(
	cameraBoxPos,
	new Vector3( 300, -200, 400 ),
	cameraSolarPos
);

const curveFromSolar = new QuadraticBezierCurve3(
	cameraSolarPos,
	new Vector3( 300, -200, 400 ),
	cameraBoxPos
);

const points = curveToSolar.getPoints( 500 );
const geometry = new BufferGeometry().setFromPoints( points );
const material = new LineBasicMaterial( { color : 0xff0000 } );
const curveObject = new Line( geometry, material );
scene.add(curveObject);


const cameraLookAtPoint = new Vector3(700,-100,0);


//First render
camera.position.copy(cameraBoxPos);
renderer.render(scene, camera);

const storyStage = {
    stage0: 0,
    stage1: 1,
    stage2: 2,
    stage3: 3,
}

let currentStory: number = storyStage.stage0;

//scroll callback
function tellTheStory() {
    const main: HTMLElement = document.getElementById("main")!;
    const currOffsetPerc:number = Math.round(document.body.getBoundingClientRect().top / main.offsetHeight *-100)

    console.log(currOffsetPerc);

    if(currOffsetPerc<20){
        if(currentStory != storyStage.stage0){
            currentStory = storyStage.stage0;
            //cameraTweenToPos(camera, curveToSolar.getPoint(0),3000);
            cameraTweenToPosAtCurve(camera, curveFromSolar,5000);
            cameraTweenLook(camera, cameraBoxPos, box.greetingBox.position,8000,TWEEN.Easing.Linear.None);
            console.log("Pierwsza animacja");
        }
        box.animateBox(currOffsetPerc,0,20);
    }
    else if(currOffsetPerc>=20 && currOffsetPerc<40){
        if(currentStory != storyStage.stage1){
            currentStory = storyStage.stage1;
            //cameraTweenToPos(camera, curveToSolar.getPoint(1),3000);
            cameraTweenToPosAtCurve(camera, curveToSolar,5000);
            cameraTweenLook(camera, curveToSolar.getPoint(1), cameraLookAtPoint ,8000,TWEEN.Easing.Linear.None);
            console.log("Druga animacja");
            solarSystem.toggleSolarSystem();
            controls.target.copy(solarCenter);
        }

    } else {
        if(currentStory != storyStage.stage2){
            currentStory = storyStage.stage2;
            console.log("Trzecia animacja");
        }
        
    }
}

var scrolled = false;
function checkScroll(){
    if(!scrolled){
        scrolled = true;
        tellTheStory();
        setTimeout(function () { scrolled = false; }, 100);
        console.log(TWEEN.getAll().length)
    };
}
document.body.onscroll=checkScroll;;


//resize callback
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}
window.addEventListener( 'resize', onWindowResize, false );



//animate loop
function animate(){
    //requestAnimationFrame(animate);
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 10 );
    //GreetingBox.updateTweens();
    TWEEN.update()
    controls.update(); 
    //stats.update();
    renderer.render(scene,camera);
    solarSystem.renderSolarSystem();
}
animate();
