// import * as log from 'loglevel';
// import CanvasWrapper from './canvas_wrapper';
import DomainController from './domain_controller';
import Util from '../util';
import StreamlineGenerator from '../impl/streamlines';
console.log("--------------------");
console.log("road_gui.ts is running");
/**
 * Handles creation of roads
 */
export default class RoadGUI {
    constructor(params, integrator, guiFolder, closeTensorFolder, folderName, redraw, _animate = false) {
        this.params = params;
        this.integrator = integrator;
        this.guiFolder = guiFolder;
        this.closeTensorFolder = closeTensorFolder;
        this.folderName = folderName;
        this.redraw = redraw;
        this._animate = _animate;
        this.existingStreamlines = [];
        this.domainController = DomainController.getInstance();
        this.preGenerateCallback = () => { };
        this.postGenerateCallback = () => { };
        this.streamlinesInProgress = false;
        this.streamlines = new StreamlineGenerator(this.integrator, this.domainController.origin, this.domainController.worldDimensions, this.params);
        // Update path iterations based on window size
        this.setPathIterations();
        window.addEventListener('resize', () => this.setPathIterations());
    }
    initFolder() {
        const roadGUI = {
            Generate: () => this.generateRoads(this._animate).then(() => this.redraw()),
            JoinDangling: () => {
                this.streamlines.joinDanglingStreamlines();
                this.redraw();
            },
        };
        const folder = this.guiFolder.addFolder(this.folderName);
        folder.add(roadGUI, 'Generate');
        // folder.add(roadGUI, 'JoinDangling');
        const paramsFolder = folder.addFolder('Params');
        paramsFolder.add(this.params, 'dsep');
        paramsFolder.add(this.params, 'dtest');
        const devParamsFolder = paramsFolder.addFolder('Dev');
        this.addDevParamsToFolder(this.params, devParamsFolder);
        return this;
    }
    set animate(b) {
        this._animate = b;
    }
    get allStreamlines() {
        return this.streamlines.allStreamlinesSimple;
    }
    get roads() {
        // For drawing not generation, probably fine to leave map
        return this.streamlines.allStreamlinesSimple.map(s => s.map(v => this.domainController.worldToScreen(v.clone())));
    }
    roadsEmpty() {
        return this.streamlines.allStreamlinesSimple.length === 0;
    }
    setExistingStreamlines(existingStreamlines) {
        this.existingStreamlines = existingStreamlines;
    }
    setPreGenerateCallback(callback) {
        this.preGenerateCallback = callback;
    }
    setPostGenerateCallback(callback) {
        this.postGenerateCallback = callback;
    }
    clearStreamlines() {
        this.streamlines.clearStreamlines();
    }
    async generateRoads(animate = false) {
        this.preGenerateCallback();
        this.domainController.zoom = this.domainController.zoom / Util.DRAW_INFLATE_AMOUNT;
        this.streamlines = new StreamlineGenerator(this.integrator, this.domainController.origin, this.domainController.worldDimensions, Object.assign({}, this.params));
        this.domainController.zoom = this.domainController.zoom * Util.DRAW_INFLATE_AMOUNT;
        for (const s of this.existingStreamlines) {
            this.streamlines.addExistingStreamlines(s.streamlines);
        }
        this.closeTensorFolder();
        this.redraw();
        return this.streamlines.createAllStreamlines(animate).then(() => this.postGenerateCallback());
    }
    /**
     * Returns true if streamlines changes
     */
    update() {
        return this.streamlines.update();
    }
    addDevParamsToFolder(params, folder) {
        folder.add(params, 'pathIterations');
        folder.add(params, 'seedTries');
        folder.add(params, 'dstep');
        folder.add(params, 'dlookahead');
        folder.add(params, 'dcirclejoin');
        folder.add(params, 'joinangle');
        folder.add(params, 'simplifyTolerance');
        folder.add(params, 'collideEarly');
    }
    /**
     * Sets path iterations so that a road can cover the screen
     */
    setPathIterations() {
        const max = 1.5 * Math.max(window.innerWidth, window.innerHeight);
        this.params.pathIterations = max / this.params.dstep;
        Util.updateGui(this.guiFolder);
    }
}
