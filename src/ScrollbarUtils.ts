
import { Easing, Tween } from '@tweenjs/tween.js';
import { Scene, Group, Mesh, MeshBasicMaterial, RingBufferGeometry, CircleBufferGeometry, Object3D, MathUtils, ColorRepresentation, OrthographicCamera, WebGLRenderer } from 'three';
import { CameraUtils } from './CameraUtils';
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

    public set checkScrollDisabled(value: boolean) {
        this._checkScrollDisabled = value;
    }

    public get checkScrollDisabled(): boolean {
        return this._checkScrollDisabled;
    }



    constructor(main: HTMLElement, cameraUtils: CameraUtils, color: ColorRepresentation) {
        this.main = main;
        this.sections = main.children
        this.cameraUtils = cameraUtils;
        this.color = color;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.cameraOrtho = new OrthographicCamera(- width / 2, width / 2, height / 2, - height / 2, 1, 10);
        this.cameraOrtho.position.z = 10;
        this.sceneOrtho = new Scene();
    }

    prepareListeners() {
        const _this = this;
        window.addEventListener('touchstart', function (e) {
            if (_this.checkScrollDisabled)
                return;
            _this.swipeStart = e.changedTouches[0];
            if (_this.main.parentElement === document.activeElement && e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation()
        }, { passive: false });

        const boundCheckScroll = this.checkScroll;
        const boundScrollDown = this.scrollDown.bind(this);

        window.addEventListener('scroll', throttle(boundCheckScroll, 200), { passive: false });
        window.addEventListener('wheel', throttle(boundCheckScroll, 200), { passive: false });
        window.addEventListener('touchend', boundCheckScroll, { passive: false });

        const chevron = document.getElementById('chevron')!;
        chevron.addEventListener('click', boundScrollDown, { passive: true });
        chevron.addEventListener('touchend', boundScrollDown, { passive: true });


        this.userIdle();
    }



    private scrollDirection = (ev: any) => {
        if (ev.type === 'wheel')
            return ev.wheelDelta ? ev.wheelDelta : -1 * ev.deltaY
        if (ev.type === 'touchend') {
            return this.calcTouchDist(ev);
        };
    };

    private calcTouchDist(ev: TouchEvent) {
        let end = ev.changedTouches[0];
        const diff = end?.screenY - this.swipeStart.screenY;
        if (Math.abs(diff) < 10)
            return 0;
        else
            return diff;
    }

    public checkScroll = (ev: Event) => {
        if (this.checkScrollDisabled) {
            return;
        }
        this.sectionScrolling2(ev);
        if (ev.cancelable)
            ev.preventDefault();
        return false;
    }


    private sectionScrolling2 = (ev: Event) => {
        const dir = this.scrollDirection(ev)
        if (dir > 0) {
            if (this.currentSection > 0) {
                this.scrollUp();
            }
        } else if (dir < 0) {
            this.scrollDown();
        }
    }

    private scrollDown() {
        if (this.currentSection < this.sections.length - 1) {
            this.sections[++this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
            this.cameraScrolling();
        }
    }

    private scrollUp() {
        if (this.currentSection > 0) {
            this.sections[--this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
            this.cameraScrolling();
        }
    }

    public scrollCurrent() {
        this.sections[this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
        this.cameraScrolling();
    }

    public cameraScrolling() {
        let cameraSection = this.currentSection;

        let leanAngle = 0;
        if (this.sections[cameraSection].classList.contains("left")) {
            leanAngle = LEAN_LEFT;
        } else if (this.sections[cameraSection].classList.contains("right")) {
            leanAngle = LEAN_RIGHT;
        }

        //move camera
        this.cameraUtils.moveCameraAlongSplineAndLean(cameraSection, 3000, MathUtils.degToRad(leanAngle));

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

    public render(renderer: WebGLRenderer) {
        renderer.render(this.sceneOrtho, this.cameraOrtho);
    }

    createScrollbar() {

        const geometry = new RingBufferGeometry(1.5, 2, 20);
        const material = new MeshBasicMaterial({
            depthTest: false,
            opacity: 0.2,
            transparent: true
        });
        this.scrollbar = new Group();

        this.updateScrollbarPosition();

        for (let index = 0; index < this.sections.length; index++) {
            const circleMesh = new Mesh(geometry, material);
            circleMesh.position.set(0, index * SCROLL_BAR_DISTANCE, 0)
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
        const that = this;
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

        function resetTimer(ev: Event) {
            clearTimeout(t);
            t = setTimeout(fadeInChevron, 6000);
            fadeOutChevron();
        }
    }

    public disableCheckScroll = () => { this.checkScrollDisabled = true };

    public enableCheckScroll = () => { this.checkScrollDisabled = false };

}
