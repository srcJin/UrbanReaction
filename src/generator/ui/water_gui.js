import Util from '../util';
import WaterGenerator from '../impl/water_generator';
import RoadGUI from './road_gui';
console.log("--------------------");
console.log("water_gui.ts is running");
/**
 * Handles generation of river and coastline
 */
export default class WaterGUI extends RoadGUI {
    constructor(tensorField, params, integrator, guiFolder, closeTensorFolder, folderName, redraw) {
        super(params, integrator, guiFolder, closeTensorFolder, folderName, redraw);
        this.tensorField = tensorField;
        this.params = params;
        this.streamlines = new WaterGenerator(this.integrator, this.domainController.origin, this.domainController.worldDimensions, Object.assign({}, this.params), this.tensorField);
    }
    initFolder() {
        const folder = this.guiFolder.addFolder(this.folderName);
        folder.add({ Generate: () => this.generateRoads() }, 'Generate');
        const coastParamsFolder = folder.addFolder('CoastParams');
        coastParamsFolder.add(this.params.coastNoise, 'noiseEnabled');
        coastParamsFolder.add(this.params.coastNoise, 'noiseSize');
        coastParamsFolder.add(this.params.coastNoise, 'noiseAngle');
        const riverParamsFolder = folder.addFolder('RiverParams');
        riverParamsFolder.add(this.params.riverNoise, 'noiseEnabled');
        riverParamsFolder.add(this.params.riverNoise, 'noiseSize');
        riverParamsFolder.add(this.params.riverNoise, 'noiseAngle');
        folder.add(this.params, 'simplifyTolerance');
        const devParamsFolder = folder.addFolder('Dev');
        this.addDevParamsToFolder(this.params, devParamsFolder);
        return this;
    }
    generateRoads() {
        this.preGenerateCallback();
        this.domainController.zoom = this.domainController.zoom / Util.DRAW_INFLATE_AMOUNT;
        this.streamlines = new WaterGenerator(this.integrator, this.domainController.origin, this.domainController.worldDimensions, Object.assign({}, this.params), this.tensorField);
        this.domainController.zoom = this.domainController.zoom * Util.DRAW_INFLATE_AMOUNT;
        this.streamlines.createCoast();
        this.streamlines.createRiver();
        this.closeTensorFolder();
        this.redraw();
        this.postGenerateCallback();
        return new Promise(resolve => resolve());
    }
    /**
     * Secondary road runs along other side of river
     */
    get streamlinesWithSecondaryRoad() {
        const withSecondary = this.streamlines.allStreamlinesSimple.slice();
        withSecondary.push(this.streamlines.riverSecondaryRoad);
        return withSecondary;
    }
    get river() {
        return this.streamlines.riverPolygon.map(v => this.domainController.worldToScreen(v.clone()));
    }
    get secondaryRiver() {
        return this.streamlines.riverSecondaryRoad.map(v => this.domainController.worldToScreen(v.clone()));
    }
    get coastline() {
        // Use unsimplified noisy streamline as coastline
        // Visual only, no road logic performed using this
        return this.streamlines.coastline.map(v => this.domainController.worldToScreen(v.clone()));
    }
    get seaPolygon() {
        return this.streamlines.seaPolygon.map(v => this.domainController.worldToScreen(v.clone()));
    }
    addDevParamsToFolder(params, folder) {
        folder.add(params, 'dsep');
        folder.add(params, 'dtest');
        folder.add(params, 'pathIterations');
        folder.add(params, 'seedTries');
        folder.add(params, 'dstep');
        folder.add(params, 'dlookahead');
        folder.add(params, 'dcirclejoin');
        folder.add(params, 'joinangle');
    }
}
