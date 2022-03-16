import { GUI } from 'lil-gui';
import { AdditiveBlending, BufferGeometry, Group, LoadingManager, MathUtils, Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry, Points, PointsMaterial, Scene, Sprite, SpriteMaterial, Texture, TextureLoader, Vector3 } from 'three';
import { saveAs } from 'file-saver';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import CLOUDS from '../assets/dataCloud.json'
import { DEFAULT_UNIVERSE_SIZE } from './main';

const spriteOpacity = 1;

enum Files {
StarCluster,
BlueStars,
PurpleCloud,
OrangeNebula,
OrangeNebula2,
BlueNebula
}

export class Nebula {

    univerSize: number;
    univerFactor: number;
    cloudGroup: Group = new Group();
    points: Points<BufferGeometry, PointsMaterial>;
    range: number;
    scene: Scene;
    resetFactor: number;
    spriteScale: number;
    distanceFactor: number = 0.2;
    textures:Texture[] = [];
    pivots: Group = new Group();
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

    constructor(universSize: number, scene :Scene , loadingManager: LoadingManager) {

        this.univerSize=universSize;
        this.univerFactor=this.univerSize/DEFAULT_UNIVERSE_SIZE;
        this.points = new Points();
        this.range=50;
       
        this.resetFactor=0.99;
        this.scene=scene;
        this.spriteScale=this.univerSize/8;
        
        for (let file in Files) {
            if (isNaN(Number(file))){
                this.textures.push ( new TextureLoader(loadingManager).load( 'assets/nebula/'+file+'.webp' ));      
            }
        }

        //this.generatePoints(this.range);
        this.setPositions(this.range);
 
        // this.createGUI().close();
    }


    //metod that sets textures in strict positions
    private setPositions(_range: number){
        const _this = this;
        const materials: MeshBasicMaterial[] = [];

        for (let file in Files) {
            if (!isNaN(Number(file))){
                materials.push (new MeshBasicMaterial( { 
                    map: _this.textures[file],
                    depthTest: false,
                    depthWrite: false,
                    blending : AdditiveBlending} ));      
            }
        }

        //Orange nebula
        const orangeAngle = MathUtils.degToRad(140);
        placeSprite(materials[Files.OrangeNebula],-3100,0.4,orangeAngle+0.0,3500,3500, 0.0);        
        placeSprite(materials[Files.OrangeNebula],-3500,0.0,orangeAngle+0.3,2800,2800, -1.0);
        placeSprite(materials[Files.StarCluster],  -4000,0.35,orangeAngle-0.15,4000,4000, -0.4);

        placeSprite(materials[Files.OrangeNebula2],-3700,-0.3,orangeAngle-0.2,5000,6500, 0.2);
        placeSprite(materials[Files.StarCluster],  -4500,-0.5,orangeAngle-0.2,3500,3500, -2.4);

        
        // let startAngle = orangeAngle+MathUtils.degToRad(-30);
        // let endAngle = orangeAngle+MathUtils.degToRad(+30);
        // let count = 6;
        // let arc = endAngle-startAngle;
        // for (let index = 0; index < count; index++) {
        //     placeSprite(materials[Files.PurpleCloud],-3500+MathUtils.randFloatSpread(this.univerSize/10),MathUtils.randFloatSpread(2),startAngle+index*arc/count,10000,10000, MathUtils.randFloatSpread(Math.PI));
        // }


        const blueAngle = MathUtils.degToRad(-60);

        // //blue nebula
        placeSprite(materials[Files.BlueStars],-2400,0.3,blueAngle-0.3,5000,3000, -3.8,0.5);
        placeSprite(materials[Files.BlueStars],-2400,0.2,blueAngle-0.2,4500,4000, -0.2,0.1);
        // placeSprite(materials[Files.BlueStars],-2400,0.1,blueAngle-0.2,5000,3000, -3.8,-0.4);
        // placeSprite(materials[Files.BlueStars],-2400,-0.1,blueAngle+0.3,4000,5000, 0.3,-0.5);
        placeSprite(materials[Files.BlueStars],-1800,0.4,blueAngle+0.3,2000,2000, 0.3,0.1);
        placeSprite(materials[Files.BlueStars],-1600,0.5,blueAngle+0.4,2000,2000, 0.3,-0.3);
        placeSprite(materials[Files.StarCluster], -4000,0.2,blueAngle-0.1,2500,2500, 0,0.2);
        placeSprite(materials[Files.BlueNebula],-3500,0.2,blueAngle+0.0,3000,3000, 0.3,-0.3);
        placeSprite(materials[Files.BlueNebula],-5000,0.0,blueAngle+0.0,10000,10000, 2.0,);
        

        const middleAngle1 = blueAngle+(Math.PI/2)
        const middleAngle2 = blueAngle-(Math.PI/2)

        placeSprite(materials[Files.BlueStars], -4000,-0.1, middleAngle1,10000,10000, 0.5);
        placeSprite(materials[Files.BlueStars], -4000, 0.1, middleAngle2,10000,10000, 0.5);
 

        function placeSprite(material: MeshBasicMaterial, distance:number, angleZ:number, angleY: number, scaleX:number, scaleY: number, matRot: number,angleX?:number) {

            const pivot = new Object3D();        
            const geometry = new PlaneBufferGeometry() ;
            distance *= _this.univerFactor;
            scaleX *= _this.univerFactor;
            scaleY *= _this.univerFactor;
    
            const mesh = new Mesh( geometry, material );

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

           _this.pivots.add(pivot);
            // _this.scene.add(pivot)
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

            const x = MathUtils.randFloatSpread(range);
            const y = MathUtils.randFloatSpread(range);
            const z = MathUtils.randFloatSpread(range);
            oldX += x;
            oldY += y;
            oldZ += z;
        }

        // For future use
        // @ts-ignore
        function middleNebula() {
            _this.borders.b0=0
            _this.borders.b1=0;
            _this.borders.b2=0.1;
            _this.borders.b3=0.7;
            _this.borders.b4=1;
            _this.borders.b5=1;
            _this.borders.b6=1;
            _this.borders.b7=1;
            range =  _this.univerSize/2;
            _this.distanceFactor=0.3;
            _this.spriteScale=range;

            const arc = MathUtils.randFloat(0,20);
            const y = MathUtils.randFloatSpread(range);
            const x = MathUtils.randFloatSpread(range/4);

            oldArc +=arc
            oldX = Math.cos(oldArc)*(range+x);
            oldY = y;
            oldZ = Math.sin(oldArc)*(range+x);

        }
    }

    private addCloud( oldX: number, oldY: number, oldZ: number) {

        const material =  this.getMaterial();
        
        const spriteMaterial = new SpriteMaterial({ 
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
        const sprite = new Sprite(spriteMaterial);
        sprite.position.set(oldX, oldY, oldZ);
        sprite.scale.set(this.spriteScale, this.spriteScale, 1.0);
        sprite.material.rotation = MathUtils.randInt(0, 90);
        
        this.cloudGroup.add(sprite);
    }

    getMaterial(): Texture {

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

    public addToScene(scene: Scene) {
        this.pivots.visible=false;
        scene.add(this.pivots)
    }

    public toggleVisibility() {
        this.pivots.visible = !this.pivots.visible;
    }

    createGUI(): GUI {

        const _this = this;

        const gui = new GUI();
        
        gui.add(_this, 'range', 0,100).step(1).onChange(
            function(value:any)
            {  _this.cloudGroup.clear();
               _this.generatePoints(value); }
        );

        gui.add(_this, 'resetFactor', 0.97,1).step(0.001).listen();

        

        gui.add(_this.borders, 'b0', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value, this.bordersOld.b0);
            }
        );
        gui.add(_this.borders, 'b1', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value, this.bordersOld.b1);
            }
        );
        gui.add(_this.borders, 'b2', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value,this.bordersOld.b2);
            }
        );
        gui.add(_this.borders, 'b3', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value,this.bordersOld.b3);
            }
        );
        gui.add(_this.borders, 'b4', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value,this.bordersOld.b4);
            }
        );
        gui.add(_this.borders, 'b5', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value,this.bordersOld.b5);
            }
        );
        gui.add(_this.borders, 'b6', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value,this.bordersOld.b6);
            }
        );
        gui.add(_this.borders, 'b7', 0.0,1).step(0.01).listen().onFinishChange(
            (value:any) => {
                this.moveBorder(value,this.bordersOld.b7);
            }
        );


        

        var genNew = { button:function(){ 
            const oldPoints = new Points<BufferGeometry, PointsMaterial>().copy(_this.points);
            _this.generatePoints(_this.range);
            var merged = mergeBufferGeometries([oldPoints.geometry, _this.points.geometry]);
            _this.points.geometry=merged;
            }
        };

        gui.add(genNew,'button').name('Add new');
        
        var load = { button:function(){
            
            // _this.points.copy(new ObjectLoader().parse( STARS ));
            _this.cloudGroup.clear();
            // _this.cloudGroup.copy(new ObjectLoader().parse( CLOUDS ));

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