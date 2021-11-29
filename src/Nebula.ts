import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import * as THREE from 'three';
import { AdditiveBlending, DoubleSide, Group, Mesh, MeshToonMaterial, Object3D, Scene, Sprite, Vector3 } from 'three';
import { saveAs } from 'file-saver';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'fs';
// import STARS from '../assets/dataStars.json'
import CLOUDS from '../assets/dataCloud.json'

const spriteOpacity = 1;

enum Files {
Miriade,
DustGoThru,
Middle_Nebula2,
DarkMatter,
DarkMatter2,
Nebula001,
Nebula006,
Nebula007,
Middle_Nebula,
}

export class Nebula {

    univerSize: number;
    cloudGroup: THREE.Group = new Group();
    points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    range: number;
    scene: THREE.Scene;
    resetFactor: number;
    markers: Sprite[] = [];
    spriteScale: number;
    distanceFactor: number = 0.2;
    textures:THREE.Texture[] = [];
    borders = {
        b0:0,
        b1:0.05,
        b2:0.15,
        b3:0.20,
        b4:0.25,
        b5:0.35,
        b6:0.55,
        b7:0.95    
    };

    bordersOld = Object.assign({}, this.borders);

    constructor(universSize: number, starsCount: number, scene :Scene) {

        this.univerSize=universSize*2;
        this.points = new THREE.Points();
        this.range=50;
       
        this.resetFactor=0.99;
        this.scene=scene;
        this.spriteScale=500;
        
        for (let file in Files) {
            if (isNaN(Number(file))){
                this.textures.push ( new THREE.TextureLoader().load( 'assets/nebula/'+file+'.png' ));      
            }
        }

        //this.generatePoints(this.range);
        this.setPositions(this.range);
 
        this.createGUI().close();
    }


    //metod that sets textures in strict positions
    private setPositions(range: number){
        const _this = this;
        const materials: THREE.MeshBasicMaterial[] = [];
        let startAngle = THREE.MathUtils.degToRad(40);
        let endAngle = THREE.MathUtils.degToRad(160);
        let arc = endAngle-startAngle;
        let count = 5;

        for (let file in Files) {
            if (!isNaN(Number(file))){
                materials.push (new THREE.MeshBasicMaterial( { 
                    map: _this.textures[file],
                    depthTest: false,
                    depthWrite: false,
                    blending : AdditiveBlending} ));      
            }
        }

        //Orange nebula
        placeSprite(materials[Files.DarkMatter],-2400,0.7,-0.1,4500,4000, -0.2);
        placeSprite(materials[Files.DarkMatter],-2200,-0.5,-0.2,3000,5000, -3.4);
        // placeSprite(materials[Files.DarkMatter],-2000,-0.3,0.2,2500,4000, 0.3);

        placeSprite(materials[Files.DarkMatter2],-3000,0.2,-0.1,7000,7000, 0.2);
        // placeSprite(materials[Files.DarkMatter2],-4000,0.6,0,2000,2000, 0.8);
        placeSprite(materials[Files.Miriade],    -5000,0.2,0,7000,7000, 0);
        // placeSprite(materials[Files.Middle_Nebula],-3500,0.2,0,3000,3000, 0);

        startAngle = THREE.MathUtils.degToRad(-30);
        endAngle = THREE.MathUtils.degToRad(30);
        arc = endAngle-startAngle;
        count = 5;
 
        for (let index = 0; index < count; index++) {
            placeSprite(materials[Files.Nebula007],-3500+THREE.MathUtils.randFloatSpread(400),THREE.MathUtils.randFloatSpread(2),startAngle+index*arc/count,5000,5000, THREE.MathUtils.randFloatSpread(Math.PI));
        }



        //green + purple nebula
        startAngle = THREE.MathUtils.degToRad(40);
        endAngle = THREE.MathUtils.degToRad(160);
        arc = endAngle-startAngle;
        count = 5;
        
        count = 3;        
        for (let index = 0; index < count; index++) {
            placeSprite(materials[Files.Middle_Nebula],-2000+THREE.MathUtils.randFloatSpread(400),THREE.MathUtils.randFloatSpread(2),startAngle+index*arc/count,8000,8000, THREE.MathUtils.randFloatSpread(Math.PI));
        }
        count = 4;
        for (let index = 0; index < count; index++) {
            placeSprite(materials[Files.Nebula001],-2000+THREE.MathUtils.randFloatSpread(400),THREE.MathUtils.randFloatSpread(2),startAngle+index*arc/count,8000,8000, THREE.MathUtils.randFloatSpread(Math.PI));
        }
        count = 5;
        for (let index = 0; index < count; index++) {
            placeSprite(materials[Files.Nebula001],-2000+THREE.MathUtils.randFloatSpread(400),THREE.MathUtils.randFloatSpread(0.8),-startAngle-index*arc/count,8000,8000, THREE.MathUtils.randFloatSpread(Math.PI));
        }
        count = 6;
        for (let index = 0; index < count; index++) {
            placeSprite(materials[Files.Nebula007],-2000+THREE.MathUtils.randFloatSpread(400),THREE.MathUtils.randFloatSpread(0.8),-startAngle-index*arc/count,8000,8000, THREE.MathUtils.randFloatSpread(Math.PI));
        }

        const backAngle = THREE.MathUtils.degToRad(180);

        // //blue nebula
        placeSprite(materials[Files.Nebula006],-2000,0.3,backAngle-0.3,5000,3000, -3.8,0.5);
        placeSprite(materials[Files.Nebula006],-2000,0.2,backAngle-0.2,4500,4000, -0.2,0.1);
        placeSprite(materials[Files.Nebula006],-2000,0.1,backAngle-0.2,5000,3000, -3.8,-0.4);
        placeSprite(materials[Files.Nebula006],-2000,-0.1,backAngle+0.3,4000,5000, 0.3,-0.5);
        placeSprite(materials[Files.Nebula006],-1200,0.4,backAngle+0.3,2000,2000, 0.3,0.1);
        placeSprite(materials[Files.Nebula006],-1000,0.5,backAngle+0.4,4000,4000, 0.3,-0.3);
        placeSprite(materials[Files.Miriade], -4000,0.2,backAngle-0.1,3000,3000, 0,0.2);


        placeSprite(materials[Files.Nebula006], -4000,-0.1, backAngle/2,10000,10000, 0.5);
        placeSprite(materials[Files.Nebula006], -4000, 0.1,-backAngle/2,10000,10000, 0.5);
 

        function placeSprite(material: THREE.MeshBasicMaterial, distance:number, angleZ:number, angleY: number, scaleX:number, scaleY: number, matRot: number,angleX?:number) {

            const pivot = new Object3D();        
            const geometry = new THREE.PlaneBufferGeometry() ;
    
            const mesh = new THREE.Mesh( geometry, material );

            pivot.position.copy(mesh.position);

            pivot.add(mesh);
            pivot.rotateY(angleY);
            pivot.rotateZ(angleZ);
    
            mesh.position.set(distance,0,0);
            mesh.lookAt(new Vector3(0,0,0));

            mesh.scale.set(scaleX, scaleY, 1.0);
            
            if(angleX)
                mesh.rotateY(angleX);

            mesh.rotateZ(matRot);

           _this.scene.add(pivot);
        }
    }
    

    //method for generating random sprite texture mix 
    private generatePoints(range: number) {
        const _this = this;

        let oldX = 0;
        let oldY = 0;
        let oldZ = 0;
        let oldArc=0;
        let tries=0;

        while (this.cloudGroup.children.length < 100) {

            blueNebula();
            //middleNebula();
            this.addCloud(oldX, oldY, oldZ);
            if(tries++>10000){break;}
        }

        function blueNebula() {
            _this.borders.b0=0
            _this.borders.b1=0;
            _this.borders.b2=0;
            _this.borders.b3=0;
            _this.borders.b4=0;
            _this.borders.b5=0;
            _this.borders.b6=0.1;
            _this.borders.b7=1;

            const x = THREE.MathUtils.randFloatSpread(range);
            const y = THREE.MathUtils.randFloatSpread(range);
            const z = THREE.MathUtils.randFloatSpread(range);
            oldX += x;
            oldY += y;
            oldZ += z;
        }

        function middleNebula() {
            _this.borders.b0=0
            _this.borders.b1=0;
            _this.borders.b2=0.1;
            _this.borders.b3=0.7;
            _this.borders.b4=1;
            _this.borders.b5=1;
            _this.borders.b6=1;
            _this.borders.b7=1;
            range =  _this.univerSize/4;
            _this.distanceFactor=0.3;
            _this.spriteScale=range;

            const arc = THREE.MathUtils.randFloat(0,20);
            const y = THREE.MathUtils.randFloatSpread(range);
            const x = THREE.MathUtils.randFloatSpread(range/4);

            oldArc +=arc
            oldX = Math.cos(oldArc)*(range+x);
            oldY = y;
            oldZ = Math.sin(oldArc)*(range+x);

        }
    }

    private addCloud( oldX: number, oldY: number, oldZ: number) {

        const material =  this.getMaterial();
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: material, 
            depthTest: false,
            transparent: false,
            opacity: spriteOpacity,
            // color: 0x59bdff
            color: 0xffffff
        });

        spriteMaterial.blending = AdditiveBlending;

        for (var j = 0; this.cloudGroup.children.length > j; j++) {
            if (this.cloudGroup.children[j].position.distanceTo(new Vector3(oldX, oldY, oldZ)) < this.spriteScale*this.distanceFactor) {
                return;
            }
        };
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(oldX, oldY, oldZ);
        sprite.scale.set(this.spriteScale, this.spriteScale, 1.0);
        sprite.material.rotation = THREE.MathUtils.randInt(0, 90);
        
        this.cloudGroup.add(sprite);
    }

    getMaterial(): THREE.Texture {

        const rand =  Math.random();


        if      (this.borders.b0<rand && rand <= this.borders.b1){return this.textures[0];}
        else if (this.borders.b1<rand && rand <= this.borders.b2){return this.textures[1];}
        else if (this.borders.b2<rand && rand <= this.borders.b3){return this.textures[2];}
        else if (this.borders.b3<rand && rand <= this.borders.b4){return this.textures[3];}
        else if (this.borders.b4<rand && rand <= this.borders.b5){return this.textures[4];}
        else if (this.borders.b5<rand && rand <= this.borders.b6){return this.textures[5];}
        else if (this.borders.b6<rand && rand <= this.borders.b7){return this.textures[6];}
        else{return this.textures[7];}




        
    }

    public addStarsToScene(scene: Scene) {
        scene.add(this.points);
        // this.markers.forEach(element => {
        //     scene.add(element)
        // });
        scene.add(this.cloudGroup);
    }

    createGUI(): GUI {

        const _this = this;

        const gui = new GUI();
        
        gui.add(_this, 'range', 0,100).step(1).onChange(
            function(value)
            {  _this.cloudGroup.clear();
               _this.generatePoints(value); }
        );

        gui.add(_this, 'resetFactor', 0.97,1).step(0.001).listen();

        

        gui.add(_this.borders, 'b0', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value, this.bordersOld.b0);
            }
        );
        gui.add(_this.borders, 'b1', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value, this.bordersOld.b1);
            }
        );
        gui.add(_this.borders, 'b2', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value,this.bordersOld.b2);
            }
        );
        gui.add(_this.borders, 'b3', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value,this.bordersOld.b3);
            }
        );
        gui.add(_this.borders, 'b4', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value,this.bordersOld.b4);
            }
        );
        gui.add(_this.borders, 'b5', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value,this.bordersOld.b5);
            }
        );
        gui.add(_this.borders, 'b6', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value,this.bordersOld.b6);
            }
        );
        gui.add(_this.borders, 'b7', 0.0,1).step(0.01).listen().onFinishChange(
            (value) => {
                this.moveBorder(value,this.bordersOld.b7);
            }
        );


        

        var genNew = { button:function(){ 
            const oldPoints = new THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>().copy(_this.points);
            _this.generatePoints(_this.range);
            var merged = BufferGeometryUtils.mergeBufferGeometries([oldPoints.geometry, _this.points.geometry]);
            _this.points.geometry=merged;
            }
        };

        gui.add(genNew,'button').name('Add new');
        
        var load = { button:function(){
            
            // _this.points.copy(new THREE.ObjectLoader().parse( STARS ));
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

        return gui;

    }


    private moveBorder(val1:number, val2:number) {
        if(val1>=val2){
            this.borders.b1 = this.borders.b0 > this.borders.b1 ? this.borders.b0 : this.borders.b1;
            this.borders.b2 = this.borders.b1 > this.borders.b2 ? this.borders.b1 : this.borders.b2;
            this.borders.b3 = this.borders.b2 > this.borders.b3 ? this.borders.b2 : this.borders.b3;
            this.borders.b4 = this.borders.b3 > this.borders.b4 ? this.borders.b3 : this.borders.b4;
            this.borders.b5 = this.borders.b4 > this.borders.b5 ? this.borders.b4 : this.borders.b5;
            this.borders.b6 = this.borders.b5 > this.borders.b6 ? this.borders.b5 : this.borders.b6;
            this.borders.b7 = this.borders.b6 > this.borders.b7 ? this.borders.b6 : this.borders.b7;
        }else{
            this.borders.b6 = this.borders.b6 > this.borders.b7 ? this.borders.b7 : this.borders.b6;
            this.borders.b5 = this.borders.b5 > this.borders.b6 ? this.borders.b6 : this.borders.b5;
            this.borders.b4 = this.borders.b4 > this.borders.b5 ? this.borders.b5 : this.borders.b4;
            this.borders.b3 = this.borders.b3 > this.borders.b4 ? this.borders.b4 : this.borders.b3;
            this.borders.b2 = this.borders.b2 > this.borders.b3 ? this.borders.b3 : this.borders.b2;
            this.borders.b1 = this.borders.b1 > this.borders.b2 ? this.borders.b2 : this.borders.b1;
            this.borders.b0 = this.borders.b0 > this.borders.b1 ? this.borders.b1 : this.borders.b0;
        }
        this.bordersOld = Object.assign({}, this.borders);
    }
}