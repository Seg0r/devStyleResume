import './style.css'
import * as THREE from 'three';
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
camera.position.set(10,30,70);
scene.add(box.greetingBox);
renderer.render(scene, camera);

//Lights
const pointLight = new THREE.PointLight(0xFFFFFF);
const pointLightHelper = new THREE.PointLightHelper(pointLight);
pointLight.position.set(0,30,200);

//Helpers
const controls = new OrbitControls(camera, renderer.domElement);;
const gridHelper = new THREE.GridHelper(200,200)
scene.add(pointLight,pointLightHelper,gridHelper);


/* 

const box1 = new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.MeshLambertMaterial( { color: 0xff00ff } ));
const box2 = new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.MeshLambertMaterial( { color: 0xffffff } ));
const box3 = new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.MeshLambertMaterial( { color: 0xffff00 } ));
box3.position.set(30,0,0);
box1.position.set(-30,0,0);

scene.add(box1,box2,box3);

const deg90 = Math.PI/2;

const q1 = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 1, 0),-(deg90));
const q2 = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 0, 1), deg90);
const q3 = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(1, 0, 0),-(deg90));
const rot2=q1.multiply(q2);
const rot3=q1.multiply(q2).multiply(q3);

GreetingBox.sRotateToPos(box1,q1);

GreetingBox.sRotateToPos(box2,q1);
GreetingBox.sRotateToPos(box2,rot2);

GreetingBox.sRotateToPos(box3,q1);
GreetingBox.sRotateToPos(box3,rot2);
GreetingBox.sRotateToPos(box3,rot3); */


function tellTheStory() {
    const main: HTMLElement = document.getElementById("main")!;
    const currOffsetPerc:number = Math.round(document.body.getBoundingClientRect().top / main.offsetHeight *-100)

    //console.log(currOffsetPerc);

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


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

window.addEventListener( 'resize', onWindowResize, false );

function animate(){
    requestAnimationFrame(animate);
    GreetingBox.updateTweens();
    controls.update();
    renderer.render(scene,camera);
}


animate();