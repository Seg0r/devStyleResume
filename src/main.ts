import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {GreetingBox} from './GreetingBox'

import {OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight,0.1,1000);
const box = new GreetingBox();
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg') as HTMLCanvasElement,
});

//Scene
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
camera.position.setZ(15);
scene.add(box.greetingBox);
renderer.render(scene, camera);

//Lights
const pointLight = new THREE.PointLight(0xFFFFFF);
const pointLightHelper = new THREE.PointLightHelper(pointLight);
pointLight.position.set(0,0,200);

//Helpers
const controls = new OrbitControls(camera, renderer.domElement);;
const gridHelper = new THREE.GridHelper(200,200)
scene.add(pointLight,pointLightHelper,gridHelper);


function tellTheStory() {
    const main: HTMLElement = document.getElementById("main")!;
    const currOffsetPerc:number = Math.round(document.body.getBoundingClientRect().top / main.offsetHeight *-100)

    console.log(currOffsetPerc);

    if(currOffsetPerc<20){
        box.animateBox(currOffsetPerc,0,20);
    }
    else if(currOffsetPerc>=20 && currOffsetPerc<40){
        console.log("Druga animacja");
    } else {
        console.log("Trzecia animacja");
    }
}

document.body.onscroll=tellTheStory;
tellTheStory();


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

window.addEventListener( 'resize', onWindowResize, false );

function animate(){
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene,camera);

}


animate();