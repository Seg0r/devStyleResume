
import * as TWEEN from '@tweenjs/tween.js';
import { Scene, Group, Mesh, MeshBasicMaterial, RingBufferGeometry, CircleBufferGeometry, Object3D, PerspectiveCamera, Camera, MathUtils } from 'three';
import { CameraUtils } from './CameraUtils';

const LEAN_LEFT = 30;
const LEAN_RIGHT = -LEAN_LEFT;
const SCROLL_BAR_DISTANCE = -10

declare type UnknownProps = Record<string, any>;

export class ScrollbarUtils {

    
    sections: HTMLCollection;
    main: HTMLElement;
    camera: PerspectiveCamera;
    currentSection = 0;
    scrollUp = 0;
    scrollDown = 0;

    scrollBarMark: Object3D | undefined;
    lastScrollbarSection: number = 0;
    scrollbar: Group | undefined;
    lastScrollTween: TWEEN.Tween<UnknownProps> | undefined;
    newScrollbarSection: number = 0;
    prevSection: number = 0;
    cameraUtils: CameraUtils;

    constructor(main:HTMLElement,cameraUtils: CameraUtils){
        this.main=main;
        this.sections=main.children
        this.cameraUtils=cameraUtils;
        this.camera=cameraUtils.camera;
    }

    private scrollDirection = (e: any) => e.wheelDelta ? e.wheelDelta : -1 * e.deltaY;

    public checkScroll = (e: WheelEvent) => {
        //e.preventDefault();
        // if (!scrolled) {
        //     scrolled = true;
        //sectionScrolling(e);
        this.sectionScrolling(e);
        //     setTimeout(function () { scrolled = false; }, 100);
        // };
    }

    public sectionScrolling2 = (e: Event) => {
        if (this.scrollDirection(e) > 0) {
            if (++this.scrollUp % 2) {
                if (this.currentSection > 0) {
                    this.sections[--this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
                }
            }
        } else {
            if (++this.scrollDown % 2) {
                if (this.currentSection < this.sections.length) {
                    this.sections[++this.currentSection].scrollIntoView({ block: "center", behavior: 'smooth' });
                }
            }
        }
    }


    public sectionScrolling(e: any) {
        const deltaScroll = Math.sign(e.deltaY);
        const currOffsetPerc: number = this.main.scrollTop / (this.main.scrollHeight - this.main.clientHeight);

        let cameraSection = Math.floor(currOffsetPerc * this.sections.length);
        if (cameraSection >= this.sections.length) {
            cameraSection = this.sections.length - 1;
        }

        let leanAngle = 0;

        if (this.sections[cameraSection].className == "left") {
            leanAngle = LEAN_LEFT;
        } else if (this.sections[cameraSection].className == "right") {
            leanAngle = LEAN_RIGHT;
        }

         //calculate direction to avoid "overdue" wheel spin
         const deltaSection = Math.sign(cameraSection - this.prevSection);

        if (cameraSection != this.prevSection && deltaSection == deltaScroll) {

            //cameraUtils.moveCameraToPointFromSpline(cameraSpline,splinePoint,3000)
            this.cameraUtils.moveCameraAlongSplineAndLean(cameraSection, 3000, MathUtils.degToRad(leanAngle));

            this.prevSection = cameraSection;
            this.updateScrollBar(cameraSection);
        }
    }

    updateScrollBar(cameraSection: number) {

        this.newScrollbarSection = cameraSection;
        if (!this.lastScrollTween || !this.lastScrollTween.isPlaying()) {
            this.lastScrollTween = this.startNewScrollBarTween(cameraSection);
            // this.lastScrollTween!.start();
        }
    }

    private startNewScrollBarTween(cameraSection: number) {
        let part = { t: this.lastScrollbarSection };

        return new TWEEN.Tween(part)
            .to({ t: cameraSection }, 1000)
            .onUpdate((tween: any) => {
                const pos = tween.t * SCROLL_BAR_DISTANCE;
                this.scrollBarMark?.position.set(0, pos, 0)   
            })
            .easing(TWEEN.Easing.Cubic.InOut)
            .onComplete((tween) => {
                // console.log("end:" + tween.t + " this.newCameraSection:" + this.newCameraSection)
                this.lastScrollbarSection = tween.t;
                if (this.lastScrollbarSection != this.newScrollbarSection) {
                    this.lastScrollTween = this.startNewScrollBarTween(this.newScrollbarSection);
                }
            }).start()
    }

    public addScrollbar(scene: Scene) {

        if (!this.scrollBarMark) {
            scene.add(this.camera)
            this.createScrollbar();
        }
    }

    createScrollbar() {

        const geometry = new RingBufferGeometry(1.5, 2, 20);
        const material = new MeshBasicMaterial({
            depthTest: false,
            opacity: 0.2,
            transparent: true
        });
        this.scrollbar = new Group();
        //add scrollbar to camera to fix position
        this.camera.add(this.scrollbar);

        this.setScrollbarPosition(this.camera.aspect * 112, -200);

        for (let index = 0; index < this.sections.length - 1; index++) {
            const circleMesh = new Mesh(geometry, material);
            circleMesh.position.set(0, index * SCROLL_BAR_DISTANCE, 0)
            this.scrollbar.add(circleMesh);
            this.scrollbar.position.setY(index * 5)
        }

        const markGeo = new CircleBufferGeometry(1.2, 20);
        const markMat = new MeshBasicMaterial({ color: 0xfedd1f,depthTest: false });
        this.scrollBarMark = new Mesh(markGeo, markMat);
        
        this.scrollBarMark.renderOrder = 1;
        this.scrollbar.add(this.scrollBarMark);

    }

    public setScrollbarPosition(x: number, z: number) {
        this.scrollbar?.position.setX(x);
        this.scrollbar?.position.setZ(z);
    }




    public isElementInViewport (el:HTMLElement) {

        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
        );
    }
}