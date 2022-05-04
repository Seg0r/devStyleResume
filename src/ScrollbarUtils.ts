
import { Easing, Tween } from '@tweenjs/tween.js';
import { Scene, Group, Mesh, MeshBasicMaterial, RingBufferGeometry, CircleBufferGeometry, Object3D, MathUtils, ColorRepresentation, OrthographicCamera, WebGLRenderer, Raycaster, Vector2 } from 'three';
import { CameraUtils } from './CameraUtils';
// @ts-ignore 
import { throttle } from './utils/utils';

const LEAN_LEFT = 30;
const LEAN_RIGHT = -LEAN_LEFT;
const SCROLL_BAR_DISTANCE = -10

declare type UnknownProps = Record<string, any>;

export class ScrollbarUtils {


    sections: HTMLCollection;
    main: HTMLElement;
    currentSection = 0;

    scrollBarMark: Object3D | undefined;
    lastScrollbarSection: number = 0;
    scrollbar: Group | undefined;
    lastScrollTween: Tween<UnknownProps> | undefined;
    newScrollbarSection: number = 0;
    cameraUtils: CameraUtils;
    scrollChecked: boolean = false;
    chevronVisible = false;
    color: ColorRepresentation;
    cameraOrtho: any;
    sceneOrtho: Scene;
    ticking = false;
    scrollSensitivitySetting = 30;
    slideDurationSetting = 600;
    currentSlideNumber = 0;
    swipeStart!: Touch;
    swipeDir: number = 0;
    private _checkScrollDisabled: boolean = false;
    raycaster: Raycaster;
    mouse: Vector2;
    renderer: WebGLRenderer;
    scrollBarClickable: Mesh[]=[];
    waiting: boolean;

    public set checkScrollDisabled(value: boolean) {
        this._checkScrollDisabled = value;
    }

    public get checkScrollDisabled(): boolean {
        return this._checkScrollDisabled;
    }



    constructor(main: HTMLElement, cameraUtils: CameraUtils, color: ColorRepresentation,renderer: WebGLRenderer) {
        this.main = main;
        this.sections = main.children
        this.cameraUtils = cameraUtils;
        this.color = color;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.cameraOrtho = new OrthographicCamera(- width / 2, width / 2, height / 2, - height / 2, 1, 10);
        this.cameraOrtho.position.z = 10;
        this.sceneOrtho = new Scene();

        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        this.renderer = renderer;

        const boundCheckIntersect = this.checkIntersect.bind(this);

        document.addEventListener('mousedown', boundCheckIntersect, false);
        document.addEventListener('touchstart', boundCheckIntersect, false);

        this.waiting = false;
    }

    prepareListeners() {
        const _this = this;
        window.addEventListener('touchstart', function (e) {
            if (_this.checkScrollDisabled)
                return;
            _this.swipeStart = e.changedTouches[0];
            // const target = e.target as HTMLElement;
            // if (e.cancelable) {
            //     //need to prevent for scroll working properly
            //     e.preventDefault();
            // }
            // e.stopPropagation()
        }, { passive: false });

        const boundCheckScroll = this.checkScroll;
        const boundScrollDown = this.scrollDown.bind(this);

        // window.addEventListener('scroll', throttle(boundCheckScroll, 200), { passive: false });
        window.addEventListener('wheel', boundCheckScroll, { passive: false });
        window.addEventListener('touchend', boundCheckScroll, { passive: false });

        const chevron = document.getElementById('chevron')!;
        chevron.addEventListener('click', boundScrollDown, { passive: false });
        // chevron.addEventListener('touchend', boundScrollDown, { passive: false });


        this.userIdle();
    }



    private scrollDirection = (ev: any) => {
        let diff = 0;
        let minDiff = 10;
        if (ev.type === 'wheel'){
            diff =  ev.wheelDelta ? ev.wheelDelta : -1 * ev.deltaY
            minDiff = 2; //smaller for trackpads
        }
        else if (ev.type === 'touchend') {
            let end = ev.changedTouches[0];
            diff = end?.screenY - this.swipeStart?.screenY;
        }
        if (Math.abs(diff) < minDiff)
            return 0;
        else
            return diff;
    }

    public checkScroll = (ev: Event) => {
        if (this.checkScrollDisabled) {
            return;
        }
        // console.log(ev)
        const _that=this;
        //throttle scrolling
        if (!this.waiting) {                       
            this.sectionScrolling2(ev);
            this.waiting = true;                   
            setTimeout(function () {          
                _that.waiting = false;
            }, 500);
        }
        
        //prevent all scrolling events (while throttling too)
        if ((ev.type == "wheel") && ev.cancelable){
            ev.preventDefault();
        }
        ev.stopPropagation();
        return false;
    }


    private sectionScrolling2 = (ev: Event) => {
        const dir = this.scrollDirection(ev)
        if (dir > 0) {
            this.scrollUp();
        } else if (dir < 0) {
            this.scrollDown();
        }
    }

    private scrollDown() {
        if (this.currentSection < this.sections.length - 1) {
            this.sections[++this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
            // this.sections[++this.currentSection].scrollIntoView(true);
            // console.log("Scrolled down to section "+this.currentSection)
            this.cameraScrolling();
        }
    }

    private scrollUp() {
        if (this.currentSection > 0) {
            this.sections[--this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
            // this.sections[--this.currentSection].scrollIntoView(true);
            // console.log("Scrolled up to section "+this.currentSection)
            this.cameraScrolling();
        }
    }

    public scrollCurrent() {
        this.sections[this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
        // this.sections[this.currentSection].scrollIntoView(true);
        // console.log("Scrolled current section "+this.currentSection+" into view")
        this.cameraScrolling(false);
    }

    private scrollToSection(section:number) {
        if (section < this.sections.length && section>=0) {
            this.currentSection=section;
            this.sections[this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
            // this.sections[++this.currentSection].scrollIntoView(true);
            // console.log("Scrolled down to section "+this.currentSection)
            this.cameraScrolling();
        }
    }

    public cameraScrolling(playAudio: boolean = true) {
        let cameraSection = this.currentSection;

        let leanAngle = 0;
        if (this.sections[cameraSection].classList.contains("left")) {
            leanAngle = LEAN_LEFT;
        } else if (this.sections[cameraSection].classList.contains("right")) {
            leanAngle = LEAN_RIGHT;
        }

        //move camera
        this.cameraUtils.moveCameraAlongSplineAndLean(cameraSection, 2250, MathUtils.degToRad(leanAngle),playAudio);

        //update scrollbar
        this.updateScrollBar(cameraSection);
        //if last section - turn OrbitControls autorotate
        this.cameraUtils.setAutoRotate(this.isLastSection());

    }

    isLastSection(): boolean {
        return this.currentSection == this.sections.length - 1;
    }

    updateScrollBar(cameraSection: number) {

        this.newScrollbarSection = cameraSection;
        if (!this.lastScrollTween || !this.lastScrollTween.isPlaying()) {
            this.lastScrollTween = this.startNewScrollBarTween(cameraSection);
            // this.lastScrollTween!.start();
        }
    }

    updateOrthoCamera() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.cameraOrtho.left = - width / 2;
        this.cameraOrtho.right = width / 2;
        this.cameraOrtho.top = height / 2;
        this.cameraOrtho.bottom = - height / 2;
        this.cameraOrtho.updateProjectionMatrix();
    }

    private startNewScrollBarTween(cameraSection: number) {
        let part = { t: this.lastScrollbarSection };

        return new Tween(part)
            .to({ t: cameraSection }, 1000)
            .onUpdate((tween: any) => {
                const pos = tween.t * SCROLL_BAR_DISTANCE;
                this.scrollBarMark?.position.set(0, pos, 0)
            })
            .easing(Easing.Cubic.InOut)
            .onComplete((tween) => {
                // console.log("end:" + tween.t + " this.newCameraSection:" + this.newCameraSection)
                this.lastScrollbarSection = tween.t;
                if (this.lastScrollbarSection != this.newScrollbarSection) {
                    this.lastScrollTween = this.startNewScrollBarTween(this.newScrollbarSection);
                }
            }).start()
    }

    public addScrollbar() {

        if (!this.scrollbar) {
            this.createScrollbar();
            this.sceneOrtho.add(this.scrollbar!)
        }
    }

    public render() {
        this.renderer.render(this.sceneOrtho, this.cameraOrtho);
    }

    createScrollbar() {

        const geometry = new RingBufferGeometry(1.5, 2, 20);
        const circleGeo = new CircleBufferGeometry(2);
        const material = new MeshBasicMaterial({
            depthTest: false,
            opacity: 0.2,
            transparent: true
        });
        const circleMaterial = new MeshBasicMaterial({
            visible: false,
        });
        this.scrollbar = new Group();

        this.updateScrollbarPosition();

        for (let index = 0; index < this.sections.length; index++) {
            const ringMesh = new Mesh(geometry, material);
            ringMesh.position.set(0, index * SCROLL_BAR_DISTANCE, 0);
            this.scrollbar.add(ringMesh);
            const circleMesh = new Mesh(circleGeo,circleMaterial);
            circleMesh.position.set(0, index * SCROLL_BAR_DISTANCE, 0);
            this.scrollBarClickable.push(circleMesh);
            this.scrollbar.add(circleMesh);
            this.scrollbar.position.setY(index * 15)
        }

        const markGeo = new CircleBufferGeometry(1.2, 20);
        const markMat = new MeshBasicMaterial({ color: this.color, depthTest: false });
        this.scrollBarMark = new Mesh(markGeo, markMat);

        this.scrollBarMark.renderOrder = 1;
        this.scrollbar.add(this.scrollBarMark);
        this.scrollbar.scale.set(3, 3, 1);
        this.scrollbar.position.setZ(1);
    }


    public updateScrollbarPosition() {

        this.updateOrthoCamera();
        const width = window.innerWidth / 2.05;

        this.scrollbar?.position.setX(width);
    }

    static isElementInViewport(el: HTMLElement) {
        var rect = el.getBoundingClientRect();
        var elemTop = rect.top;
        var elemBottom = rect.bottom;
        return elemTop < window.innerHeight && elemBottom >= 0;
    }


    public userIdle() {
        const chevron = document.getElementById('chevron')!;
        window.addEventListener('load', throttle(resetTimer, 100), { passive: true });
        window.addEventListener('mousedown', throttle(resetTimer, 100), { passive: true });  // catches touchscreen presses as well      
        window.addEventListener('touchstart', throttle(resetTimer, 100), { passive: true }); // catches touchscreen swipes as well      
        window.addEventListener('touchmove', throttle(resetTimer, 100), { passive: true });  // required by some devices 
        window.addEventListener('click', throttle(resetTimer, 100), { passive: true });      // catches touchpad clicks as well
        window.addEventListener('keydown', throttle(resetTimer, 100), { passive: true });
        window.addEventListener('scroll', throttle(resetTimer, 100), { passive: true });
        window.addEventListener('wheel', throttle(resetTimer, 100), { passive: true });

        const fadeInChevron = () => {
            if (!this.chevronVisible && !this.isLastSection()) {
                chevron.classList.add('chevron-container-fade-in');
                chevron.classList.remove('chevron-container-fade');
                this.chevronVisible = true;
            };
        }

        const fadeOutChevron = () => {
            if (this.chevronVisible) {
                chevron.classList.add('chevron-container-fade');
                chevron.classList.remove('chevron-container-fade-in');
                this.chevronVisible = false;
            };
        }

        let t = setTimeout(fadeInChevron, 6000);

        function resetTimer() {
            clearTimeout(t);
            t = setTimeout(fadeInChevron, 6000);
            fadeOutChevron();
        }
    }

    public disableCheckScroll = () => { this.checkScrollDisabled = true };

    public enableCheckScroll = () => { this.checkScrollDisabled = false };

    

    checkIntersect(e:any) {
        var bounds = this.renderer.domElement.getBoundingClientRect()
        if(e.clientX){
            this.mouse.x = ( (e.clientX - bounds.left) / this.renderer.domElement.clientWidth ) * 2 - 1;
            this.mouse.y = - ( (e.clientY - bounds.top) / this.renderer.domElement.clientHeight ) * 2 + 1;
        }else if(e.touches[0].clientX){
            this.mouse.x = ( (e.touches[0].clientX - bounds.left) / this.renderer.domElement.clientWidth ) * 2 - 1;
            this.mouse.y = - ( (e.touches[0].clientY - bounds.top) / this.renderer.domElement.clientHeight ) * 2 + 1;
        }
        this.raycaster.setFromCamera( this.mouse, this.cameraOrtho );
        var intersects = this.raycaster.intersectObjects(this.sceneOrtho.children, true);
        if (intersects.length > 0) {
            // console.log("trafiony")
            const section = this.scrollBarClickable.findIndex(elem=>
                elem.uuid===intersects[0].object.uuid
            );
            this.scrollToSection(section)
        }
    }
}
