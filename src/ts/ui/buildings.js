// import * as log from 'loglevel';
import DomainController from './domain_controller';
import Graph from '../impl/graph';
import PolygonFinder from '../impl/polygon_finder';
/**
 * Pseudo 3D buildings
 */
class BuildingModels {
    constructor(lots) {
        this.domainController = DomainController.getInstance();
        this._buildingModels = [];
        for (const lot of lots) {
            this._buildingModels.push({
                height: Math.random() * 20 + 20,
                lotWorld: lot,
                lotScreen: [],
                roof: [],
                sides: []
            });
        }
        this._buildingModels.sort((a, b) => a.height - b.height);
    }
    get buildingModels() {
        return this._buildingModels;
    }
    /**
     * Recalculated when the camera moves
     */
    setBuildingProjections() {
        const d = 1000 / this.domainController.zoom;
        const cameraPos = this.domainController.getCameraPosition();
        for (const b of this._buildingModels) {
            b.lotScreen = b.lotWorld.map(v => this.domainController.worldToScreen(v.clone()));
            b.roof = b.lotScreen.map(v => this.heightVectorToScreen(v, b.height, d, cameraPos));
            b.sides = this.getBuildingSides(b);
        }
    }
    heightVectorToScreen(v, h, d, camera) {
        const scale = (d / (d - h)); // 0.1
        if (this.domainController.orthographic) {
            const diff = this.domainController.cameraDirection.multiplyScalar(-h * scale);
            return v.clone().add(diff);
        }
        else {
            return v.clone().sub(camera).multiplyScalar(scale).add(camera);
        }
    }
    /**
     * Get sides of buildings by joining corresponding edges between the roof and ground
     */
    getBuildingSides(b) {
        const polygons = [];
        for (let i = 0; i < b.lotScreen.length; i++) {
            const next = (i + 1) % b.lotScreen.length;
            polygons.push([b.lotScreen[i], b.lotScreen[next], b.roof[next], b.roof[i]]);
        }
        return polygons;
    }
}
/**
 * Finds building lots and optionally pseudo3D buildings
 */
export default class Buildings {
    constructor(tensorField, folder, redraw, dstep, _animate) {
        this.tensorField = tensorField;
        this.redraw = redraw;
        this.dstep = dstep;
        this._animate = _animate;
        this.allStreamlines = [];
        this.domainController = DomainController.getInstance();
        this.preGenerateCallback = () => { };
        this.postGenerateCallback = () => { };
        this._models = new BuildingModels([]);
        this._blocks = [];
        this.buildingParams = {
            maxLength: 20000,
            minArea: 0,
            shrinkSpacing: 4,
            chanceNoDivide: 1,
        };
        folder.add({ 'AddBuildings': () => this.generate(this._animate) }, 'AddBuildings');
        folder.add(this.buildingParams, 'minArea');
        folder.add(this.buildingParams, 'shrinkSpacing');
        folder.add(this.buildingParams, 'chanceNoDivide');
        this.polygonFinder = new PolygonFinder([], this.buildingParams, this.tensorField);
    }
    set animate(v) {
        this._animate = v;
    }
    get lots() {
        return this.polygonFinder.polygons.map(p => p.map(v => this.domainController.worldToScreen(v.clone())));
    }
    /**
     * Only used when creating the 3D model to 'fake' the roads
     */
    getBlocks() {
        const g = new Graph(this.allStreamlines, this.dstep, true);
        const blockParams = Object.assign({}, this.buildingParams);
        blockParams.shrinkSpacing = blockParams.shrinkSpacing / 2;
        const polygonFinder = new PolygonFinder(g.nodes, blockParams, this.tensorField);
        polygonFinder.findPolygons();
        return polygonFinder.shrink( /*false*/).then(() => polygonFinder.polygons.map(p => p.map(v => this.domainController.worldToScreen(v.clone()))));
    }
    get models() {
        this._models.setBuildingProjections();
        return this._models.buildingModels;
    }
    setAllStreamlines(s) {
        this.allStreamlines = s;
    }
    reset() {
        this.polygonFinder.reset();
        this._models = new BuildingModels([]);
    }
    update() {
        return this.polygonFinder.update();
    }
    /**
     * Finds blocks, shrinks and divides them to create building lots
     */
    async generate(animate) {
        this.preGenerateCallback();
        this._models = new BuildingModels([]);
        const g = new Graph(this.allStreamlines, this.dstep, true);
        this.polygonFinder = new PolygonFinder(g.nodes, this.buildingParams, this.tensorField);
        this.polygonFinder.findPolygons();
        await this.polygonFinder.shrink( /*animate*/);
        await this.polygonFinder.divide( /*animate*/);
        this.redraw();
        this._models = new BuildingModels(this.polygonFinder.polygons);
        this.postGenerateCallback();
    }
    setPreGenerateCallback(callback) {
        this.preGenerateCallback = callback;
    }
    setPostGenerateCallback(callback) {
        this.postGenerateCallback = callback;
    }
}
