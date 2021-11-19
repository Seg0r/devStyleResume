import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import * as THREE from 'three';
import { Group, Scene, Sprite, Vector3 } from 'three';
import { saveAs } from 'file-saver';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'fs';
import STARS from '../assets/dataStars.json'
import CLOUDS from '../assets/dataCloud.json'

const spriteOpacity = 0.2;

export class Nebula {

    univerSize: number;
    cloudGroup: THREE.Group = new Group();
    points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    range: number;
    scene: THREE.Scene;
    resetFactor: number;
    markers: Sprite[] = [];
    spriteScale: number;

    constructor(universSize: number, starsCount: number, scene :Scene) {

        this.univerSize=universSize*2;
        new THREE.Points();
        this.range=40;
        const material = new THREE.PointsMaterial({ color: 0xffffff });
        this.resetFactor=0.98;
        this.scene=scene;
        this.spriteScale=100;

        this.points=new THREE.Points(this.generatePoints(this.range), material);
 
        this.createGUI();
    }

    private generatePoints(range: number): THREE.BufferGeometry {
        const vertices:any[] = [];
        

        // let oldX = THREE.MathUtils.randFloatSpread( this.univerSize );
        // let oldY=  THREE.MathUtils.randFloatSpread( this.univerSize );
        // let oldZ =  THREE.MathUtils.randFloatSpread( this.univerSize );

        let oldX = 0;
        let oldY = 0;
        let oldZ = 0;

        const mistTexture = new THREE.TextureLoader().load( 'assets/mist.png' );
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: mistTexture, 
            depthTest: false,
            transparent: true,
            opacity: spriteOpacity,
            depthWrite: false,
            // color: 0x59bdff
            color: 0x5ba9ff
        });

        for (let i = 0; i < 10000; i++) {

            const x = THREE.MathUtils.randFloatSpread(range);
            const y = THREE.MathUtils.randFloatSpread(range);
            const z = THREE.MathUtils.randFloatSpread(range);

            oldX += x;
            oldY += y;
            oldZ += z;

            vertices.push(oldX, oldY, oldZ);

            this.addCloud(oldX, oldY, oldZ, spriteMaterial);

            if(Math.random()>this.resetFactor)
            {
                const idx=THREE.MathUtils.randInt(0,vertices.length/3-1);                
                oldX=vertices[idx*3];
                oldY=vertices[idx*3+1];
                oldZ=vertices[idx*3+2];                
            }

            // if(Math.random()>this.resetFactor)
            // {
            //     const idx=vertices.length-THREE.MathUtils.randInt(0,vertices.length/2);
            //     if(idx>0){
            //         oldX=vertices[idx];
            //         oldY=vertices[idx+1];
            //         oldZ=vertices[idx+2];
            //     }
            // }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        geometry.attributes.position.needsUpdate = true;

        return geometry;
    }

    private addCloud( oldX: number, oldY: number, oldZ: number, spriteMaterial: THREE.SpriteMaterial) {
        
        for (var j = 0; this.cloudGroup.children.length > j; j++) {
            if (this.cloudGroup.children[j].position.distanceTo(new Vector3(oldX, oldY, oldZ)) < this.spriteScale*0.5) {
                return;
            }
        };
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(oldX, oldY, oldZ);
        sprite.scale.set(this.spriteScale, this.spriteScale, 1.0);

        sprite.rotateX(THREE.MathUtils.randInt(0, 90));
        this.cloudGroup.add(sprite);
    }

    public addStarsToScene(scene: Scene) {
        scene.add(this.points);
        // this.markers.forEach(element => {
        //     scene.add(element)
        // });
        scene.add(this.cloudGroup);
    }

    createGUI() {

        const _this = this;

        const gui = new GUI();
        
        gui.add(_this, 'range', 0,100).step(1).onChange(
            function(value)
            {  _this.cloudGroup.clear();
               _this.points.geometry =_this.generatePoints(value); }
        );

        gui.add(_this, 'resetFactor', 0.97,1).step(0.001);

        var genNew = { button:function(){ 
            var merged = BufferGeometryUtils.mergeBufferGeometries([_this.points.geometry, _this.generatePoints(_this.range)]);
            _this.points.geometry=merged;
            }
        };

        gui.add(genNew,'button').name('Add new');

        

        
        var load = { button:function(){ 
            
            _this.points.copy(new THREE.ObjectLoader().parse( STARS ));
            _this.cloudGroup.clear();
            _this.cloudGroup.copy(new THREE.ObjectLoader().parse( CLOUDS ));

            }
        };

        gui.add(load,'button').name('Load');


        var obj = { button:function(){ 
            
            let blob = new Blob([JSON.stringify(_this.points)], {type : 'application/json'});
            saveAs(blob, 'dataStars.json');
            blob = new Blob([JSON.stringify(_this.cloudGroup)], {type : 'application/json'});
            saveAs(blob, 'dataCloud.json');
            }
        };

        gui.add(obj,'button').name('Save');

    }

}