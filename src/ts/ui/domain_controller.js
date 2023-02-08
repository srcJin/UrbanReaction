// import * as log from 'loglevel';
import Vector from '../vector';
import Util from '../util';
console.log("--------------------");
console.log("domain_controller.ts is running");
/**
 * Singleton
 * Controls panning and zooming
 */
export default class DomainController {
    constructor() {
        this.ZOOM_SPEED = 0.96;
        this.SCROLL_DELAY = 100;
        // Location of screen origin in world space
        this._origin = Vector.zeroVector();
        // Screen-space width and height
        this._screenDimensions = Vector.zeroVector();
        // Ratio of screen pixels to world pixels
        this._zoom = 1;
        this.zoomCallback = () => { };
        this.lastScrolltime = -this.SCROLL_DELAY;
        this.refreshedAfterScroll = false;
        this._cameraDirection = Vector.zeroVector();
        this._orthographic = false;
        // Set after pan or zoom
        this.moved = false;
        this.setScreenDimensions();
        window.addEventListener('resize', () => this.setScreenDimensions());
        window.addEventListener('wheel', (e) => {
            if (e.target.id === Util.CANVAS_ID) {
                this.lastScrolltime = Date.now();
                this.refreshedAfterScroll = false;
                const delta = e.deltaY;
                // TODO scale by value of delta
                if (delta > 0) {
                    this.zoom = this._zoom * this.ZOOM_SPEED;
                }
                else {
                    this.zoom = this._zoom / this.ZOOM_SPEED;
                }
            }
        });
    }
    /**
     * Used to stop drawing buildings while scrolling for certain styles
     * to keep the framerate up
     */
    get isScrolling() {
        return Date.now() - this.lastScrolltime < this.SCROLL_DELAY;
    }
    // Changed to set the site boundary
    setScreenDimensions() {
        this.moved = true;
        // this._screenDimensions.setX(window.innerWidth);
        // this._screenDimensions.setY(window.innerHeight);
        this._screenDimensions.setX(1000);
        this._screenDimensions.setY(1000);
    }
    static getInstance() {
        if (!DomainController.instance) {
            DomainController.instance = new DomainController();
        }
        return DomainController.instance;
    }
    /**
     * @param {Vector} delta in world space
     */
    pan(delta) {
        this.moved = true;
        this._origin.sub(delta);
    }
    /**
     * Screen origin in world space
     */
    get origin() {
        return this._origin.clone();
    }
    get zoom() {
        return this._zoom;
    }
    get screenDimensions() {
        return this._screenDimensions.clone();
    }
    /**
     * @return {Vector} world-space w/h visible on screen
     */
    get worldDimensions() {
        return this.screenDimensions.divideScalar(this._zoom);
    }
    set screenDimensions(v) {
        this.moved = true;
        this._screenDimensions.copy(v);
    }
    set zoom(z) {
        if (z >= 0.3 && z <= 20) {
            this.moved = true;
            const oldWorldSpaceMidpoint = this.origin.add(this.worldDimensions.divideScalar(2));
            this._zoom = z;
            const newWorldSpaceMidpoint = this.origin.add(this.worldDimensions.divideScalar(2));
            this.pan(newWorldSpaceMidpoint.sub(oldWorldSpaceMidpoint));
            this.zoomCallback();
        }
    }
    onScreen(v) {
        const screenSpace = this.worldToScreen(v.clone());
        return screenSpace.x >= 0 && screenSpace.y >= 0
            && screenSpace.x <= this.screenDimensions.x && screenSpace.y <= this.screenDimensions.y;
    }
    set orthographic(v) {
        this._orthographic = v;
        this.moved = true;
    }
    get orthographic() {
        return this._orthographic;
    }
    set cameraDirection(v) {
        this._cameraDirection = v;
        // Screen update
        this.moved = true;
    }
    get cameraDirection() {
        return this._cameraDirection.clone();
    }
    getCameraPosition() {
        const centre = new Vector(this._screenDimensions.x / 2, this._screenDimensions.y / 2);
        if (this._orthographic) {
            return centre.add(centre.clone().multiply(this._cameraDirection).multiplyScalar(100));
        }
        return centre.add(centre.clone().multiply(this._cameraDirection));
        // this.screenDimensions.divideScalar(2);
    }
    setZoomUpdate(callback) {
        this.zoomCallback = callback;
    }
    /**
     * Edits vector
     */
    zoomToWorld(v) {
        return v.divideScalar(this._zoom);
    }
    /**
     * Edits vector
     */
    zoomToScreen(v) {
        return v.multiplyScalar(this._zoom);
    }
    /**
     * Edits vector
     */
    screenToWorld(v) {
        return this.zoomToWorld(v).add(this._origin);
    }
    /**
     * Edits vector
     */
    worldToScreen(v) {
        return this.zoomToScreen(v.sub(this._origin));
    }
}
