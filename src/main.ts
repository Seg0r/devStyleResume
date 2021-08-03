import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { GreetingBox } from './GreetingBox'
//import Stats from 'stats.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, PointLight, QuadraticBezierCurve3, AxesHelper, Fog, Color, FogExp2, Float32BufferAttribute, PointsMaterial, Object3D } from 'three';
import { cameraTweenLook, cameraTweenToPosAtCurve } from './cameraUtils';
import { SolarSystem } from './SolarSystem';
// @ts-ignore
import * as POSTPROCESSING from "postprocessing";
// @ts-ignore
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

//Scene
const scene: Scene = new Scene();
export const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);

const renderer = new WebGLRenderer({
    canvas: document.querySelector('#bg') as HTMLCanvasElement,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMapping = THREE.CineonToneMapping;

/* var stats = new Stats();
stats.showPanel( 0 );
document.querySelector('#main')!.appendChild( stats.dom ); */

//GreetingBox
const box = new GreetingBox();
//box.addToScene(scene);

//scene.background = new Color().setHSL(0.51, 0.4, 0.01);
//scene.fog = new Fog( scene.background,1000, 1600 );



// let directionalLight = new THREE.DirectionalLight(0xff8c19);
// directionalLight.position.set(0,0,1);
// scene.add(directionalLight);


//scene.fog = new THREE.FogExp2(0x000000, 0.001);
//renderer.setClearColor(scene.fog.color);

// camera.position.z = 1;
// camera.rotation.x = 1.16;
// camera.rotation.y = -0.12;
// camera.rotation.z = 0.27;

// let ambient = new THREE.AmbientLight(0x555555);
// scene.add(ambient);

// let directionalLight = new THREE.DirectionalLight(0xff8c19);
// directionalLight.position.set(0, 0, 1);
// scene.add(directionalLight);

// let orangeLight = new THREE.PointLight(0xcc6600, 50, 450, 1.7);
// orangeLight.position.set(200, 300, 100);
// scene.add(orangeLight);
// let redLight = new THREE.PointLight(0xd8547e, 50, 450, 1.7);
// redLight.position.set(100, 300, 100);
// scene.add(redLight);
// let blueLight = new THREE.PointLight(0x3677ac, 50, 450, 1.7);
// blueLight.position.set(300, 300, 200);
// scene.add(blueLight);

let cloudParticles: THREE.Mesh[] = [];
// let loader = new THREE.TextureLoader()
// .setPath('/assets/scene/')
// .load("smoke.png", function (texture) {
//     let cloudGeo = new THREE.PlaneBufferGeometry(500, 500);
//     let cloudMaterial = new THREE.MeshLambertMaterial({
//         map: texture,
//         transparent: true
//     });

//     for (let p = 0; p < 50; p++) {
//         let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
//         cloud.position.set(
//             Math.random() * 800 - 400,
//             500,
//             Math.random() * 500 - 500
//         );
//         cloud.rotation.x = 1.16;
//         cloud.rotation.y = -0.12;
//         cloud.rotation.z = Math.random() * 2 * Math.PI;
//         cloud.material.opacity = 0.55;
//         cloudParticles.push(cloud);
//         scene.add(cloud);
//     }
// });

let composer: POSTPROCESSING.EffectComposer;
const fileFormat = ".jpg"
const sceneLoader = new THREE.CubeTextureLoader()
	.setPath( '/assets/scene/' )
	.load( [
		'nebula_right1'+fileFormat,
		'nebula_left2'+fileFormat,
		'nebula_top3'+fileFormat,
		'nebula_bottom4'+fileFormat,
		'nebula_front5'+fileFormat,
		'nebula_back6'+fileFormat
	] , function(texture){
    scene.background = texture;
  });

// const textureEffect = new POSTPROCESSING.TextureEffect({
//   blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
//   texture: texture
// });
// textureEffect.blendMode.opacity.value = 0.2;

const bloomEffect = new POSTPROCESSING.BloomEffect({
    //   blendFunction: POSTPROCESSING.BlendFunction.SCREEN,
        blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
      kernelSize: POSTPROCESSING.KernelSize.SMALL,
      useLuminanceFilter: true,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.75
    });
bloomEffect.blendMode.opacity.value = 1.5;

let effectPass = new POSTPROCESSING.EffectPass(
  camera,
  bloomEffect
);
effectPass.renderToScreen = true;

composer = new POSTPROCESSING.EffectComposer(renderer);
composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
composer.addPass(effectPass);


//SolarSystem
const solarCenter: Vector3 = new Vector3(700, -100, 300);
const solarSize: number = 200;
const solarSystem = new SolarSystem(solarCenter, solarSize, 800);
//solarSystem.addToScene(scene);

//Stars
addStars();

//Lights
const pointLight = new PointLight(0xFFFFFF);
//const pointLightHelper = new PointLightHelper(pointLight);
pointLight.position.set(0, 0, 200);

//const ambientLight = new AmbientLight(0xFFFFFF,0.6);

//Helpers
const controls = new OrbitControls(camera, renderer.domElement);;
//const gridHelper = new GridHelper(200,200)
//scene.add(gridHelper);
//scene.add(pointLightHelper);
//scene.add(ambientLight);
//scene.add(pointLight);

//const worldAxis = new AxesHelper(100);
//scene.add(worldAxis);


//Camera positions
const cameraBoxPos = new Vector3(0, 0, 15);
const cameraSolarPos = new Vector3(400, -150, 100);

const curveToSolar = new QuadraticBezierCurve3(
    cameraBoxPos,
    new Vector3(300, -200, 400),
    cameraSolarPos
);

const curveFromSolar = new QuadraticBezierCurve3(
    cameraSolarPos,
    new Vector3(300, -200, 400),
    cameraBoxPos
);

/* const points = curveToSolar.getPoints( 500 );
const geometry = new BufferGeometry().setFromPoints( points );
const material = new LineBasicMaterial( { color : 0xff0000 } );
const curveObject = new Line( geometry, material );
scene.add(curveObject); */


const cameraLookAtPoint = new Vector3(700, -100, 0);


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

function addStars() {

    //const starParticles: THREE.Points[] = [];

    const vertices = [];
    const sizes = [];

    for (let i = 0; i < 1000; i++) {

        const x = THREE.MathUtils.randFloatSpread(3000);
        const y = THREE.MathUtils.randFloatSpread(3000);
        const z = THREE.MathUtils.randFloatSpread(3000);

        vertices.push(x, y, z);

        sizes.push(Math.random() + 0.001);

    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, sizeAttenuation: false });
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 3));
    const points = new THREE.Points(geometry, material);

    scene.add(points);
}

//scroll callback
function tellTheStory() {
    const main: HTMLElement = document.getElementById("main")!;
    const currOffsetPerc: number = Math.round(document.body.getBoundingClientRect().top / main.offsetHeight * -100)

    console.log(currOffsetPerc);

    if (currOffsetPerc < 20) {
        if (currentStory != storyStage.stage0) {
            currentStory = storyStage.stage0;
            //cameraTweenToPos(camera, curveToSolar.getPoint(0),3000);
            cameraTweenToPosAtCurve(camera, curveFromSolar, 5000);
            cameraTweenLook(camera, cameraBoxPos, box.getPosition(), 8000, TWEEN.Easing.Linear.None);
            console.log("Pierwsza animacja");
        }
        box.animateBox(currOffsetPerc, 0, 20);
    }
    else if (currOffsetPerc >= 20 && currOffsetPerc < 40) {
        if (currentStory != storyStage.stage1) {
            currentStory = storyStage.stage1;
            //cameraTweenToPos(camera, curveToSolar.getPoint(1),3000);
            cameraTweenToPosAtCurve(camera, curveToSolar, 5000);
            cameraTweenLook(camera, curveToSolar.getPoint(1), cameraLookAtPoint, 8000, TWEEN.Easing.Linear.None);
            console.log("Druga animacja");
            solarSystem.toggleSolarSystem();
            //controls.target.copy(solarCenter);
        }

    } else {
        if (currentStory != storyStage.stage2) {
            currentStory = storyStage.stage2;
            console.log("Trzecia animacja");
        }

    }
}

var scrolled = false;
function checkScroll() {
    if (!scrolled) {
        scrolled = true;
        //tellTheStory();
        setTimeout(function () { scrolled = false; }, 100);
    };
}
document.body.onscroll = checkScroll;;

solarSystem.toggleSolarSystem();
//controls.target.copy(solarCenter);
//camera.position.copy(new Vector3(0,solarSize,solarSize * 5).add(solarCenter));


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



//animate loop
function animate() {
    cloudParticles.forEach(p => {
        p.rotation.z -=0.001;
      });
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
    //renderer.render(scene, camera);
    composer.render(0.1);
    solarSystem.renderSolarSystem();
}
animate();
