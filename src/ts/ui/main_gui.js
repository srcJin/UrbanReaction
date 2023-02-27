// import * as log from 'loglevel';
import DomainController from './domain_controller';
import { RK4Integrator } from '../impl/integrator';
import Graph from '../impl/graph';
import RoadGUI from './road_gui';
import WaterGUI from './water_gui';
import PolygonFinder from '../impl/polygon_finder';
import { DefaultStyle } from './style';
import Buildings from './buildings';
import PolygonUtil from '../impl/polygon_util';
console.log("--------------------");
console.log("main_gui.ts is running");
/**
 * Handles Map folder, glues together impl
 */
export default class MainGUI {
    constructor(guiFolder, tensorField, closeTensorFolder) {
        this.guiFolder = guiFolder;
        this.tensorField = tensorField;
        this.closeTensorFolder = closeTensorFolder;
        this.numBigParks = 4;
        this.numSmallParks = 8;
        this.clusterBigParks = false;
        this.domainController = DomainController.getInstance();
        this.intersections = [];
        this.bigParks = [];
        this.smallParks = [];
        this.animate = false;
        this.animationSpeed = 1;
        this.minorParams = {
            dsep: 20,
            dtest: 15,
            dstep: 1,
            dlookahead: 40,
            dcirclejoin: 5,
            joinangle: 0.1,
            pathIterations: 1000,
            seedTries: 300,
            simplifyTolerance: 0.5,
            collideEarly: 0,
        };
        this.redraw = false;
        guiFolder.add(this, 'generateEverything');
        // guiFolder.add(this, 'simpleBenchMark');
        const animateController = guiFolder.add(this, 'animate');
        guiFolder.add(this, 'animationSpeed');
        this.coastlineParams = Object.assign({
            coastNoise: {
                noiseEnabled: false,
                noiseSize: 30,
                noiseAngle: 20,
            },
            riverNoise: {
                noiseEnabled: false,
                noiseSize: 30,
                noiseAngle: 20,
            },
            riverBankSize: 10,
            riverSize: 30,
        }, this.minorParams);
        this.coastlineParams.pathIterations = 10000;
        this.coastlineParams.simplifyTolerance = 10;
        this.majorParams = Object.assign({}, this.minorParams);
        this.majorParams.dsep = 100;
        this.majorParams.dtest = 30;
        this.majorParams.dlookahead = 200;
        this.majorParams.collideEarly = 0;
        this.mainParams = Object.assign({}, this.minorParams);
        this.mainParams.dsep = 400;
        this.mainParams.dtest = 200;
        this.mainParams.dlookahead = 500;
        this.mainParams.collideEarly = 0;
        const integrator = new RK4Integrator(tensorField, this.minorParams);
        const redraw = () => this.redraw = true;
        this.coastline = new WaterGUI(tensorField, this.coastlineParams, integrator, this.guiFolder, closeTensorFolder, 'Water', redraw).initFolder();
        this.mainRoads = new RoadGUI(this.mainParams, integrator, this.guiFolder, closeTensorFolder, 'Main', redraw).initFolder();
        this.majorRoads = new RoadGUI(this.majorParams, integrator, this.guiFolder, closeTensorFolder, 'Major', redraw, this.animate).initFolder();
        this.minorRoads = new RoadGUI(this.minorParams, integrator, this.guiFolder, closeTensorFolder, 'Minor', redraw, this.animate).initFolder();
        const parks = guiFolder.addFolder('Parks');
        parks.add({ Generate: () => {
                this.buildings.reset();
                this.addParks();
                this.redraw = true;
            } }, 'Generate');
        parks.add(this, 'clusterBigParks');
        parks.add(this, 'numBigParks');
        parks.add(this, 'numSmallParks');
        const buildingsFolder = guiFolder.addFolder('Buildings');
        this.buildings = new Buildings(tensorField, buildingsFolder, redraw, this.minorParams.dstep, this.animate);
        this.buildings.setPreGenerateCallback(() => {
            const allStreamlines = [];
            allStreamlines.push(...this.mainRoads.allStreamlines);
            allStreamlines.push(...this.majorRoads.allStreamlines);
            allStreamlines.push(...this.minorRoads.allStreamlines);
            allStreamlines.push(...this.coastline.streamlinesWithSecondaryRoad);
            this.buildings.setAllStreamlines(allStreamlines);
        });
        animateController.onChange((b) => {
            this.majorRoads.animate = b;
            this.minorRoads.animate = b;
            this.buildings.animate = b;
        });
        this.minorRoads.setExistingStreamlines([this.coastline, this.mainRoads, this.majorRoads]);
        this.majorRoads.setExistingStreamlines([this.coastline, this.mainRoads]);
        this.mainRoads.setExistingStreamlines([this.coastline]);
        this.coastline.setPreGenerateCallback(() => {
            this.mainRoads.clearStreamlines();
            this.majorRoads.clearStreamlines();
            this.minorRoads.clearStreamlines();
            this.bigParks = [];
            this.smallParks = [];
            this.buildings.reset();
            tensorField.parks = [];
            tensorField.sea = [];
            tensorField.river = [];
        });
        this.mainRoads.setPreGenerateCallback(() => {
            this.majorRoads.clearStreamlines();
            this.minorRoads.clearStreamlines();
            this.bigParks = [];
            this.smallParks = [];
            this.buildings.reset();
            tensorField.parks = [];
            tensorField.ignoreRiver = true;
        });
        this.mainRoads.setPostGenerateCallback(() => {
            tensorField.ignoreRiver = false;
        });
        this.majorRoads.setPreGenerateCallback(() => {
            this.minorRoads.clearStreamlines();
            this.bigParks = [];
            this.smallParks = [];
            this.buildings.reset();
            tensorField.parks = [];
            tensorField.ignoreRiver = true;
        });
        this.majorRoads.setPostGenerateCallback(() => {
            tensorField.ignoreRiver = false;
            this.addParks();
            this.redraw = true;
        });
        this.minorRoads.setPreGenerateCallback(() => {
            this.buildings.reset();
            this.smallParks = [];
            tensorField.parks = this.bigParks;
        });
        this.minorRoads.setPostGenerateCallback(() => {
            this.addParks();
        });
    }
    addParks() {
        const g = new Graph(this.majorRoads.allStreamlines
            .concat(this.mainRoads.allStreamlines)
            .concat(this.minorRoads.allStreamlines), this.minorParams.dstep);
        this.intersections = g.intersections;
        const p = new PolygonFinder(g.nodes, {
            maxLength: 20,
            minArea: 80,
            shrinkSpacing: 4,
            chanceNoDivide: 1,
        }, this.tensorField);
        p.findPolygons();
        const polygons = p.polygons;
        if (this.minorRoads.allStreamlines.length === 0) {
            // Big parks
            this.bigParks = [];
            this.smallParks = [];
            if (polygons.length > this.numBigParks) {
                if (this.clusterBigParks) {
                    // Group in adjacent polygons 
                    const parkIndex = Math.floor(Math.random() * (polygons.length - this.numBigParks));
                    for (let i = parkIndex; i < parkIndex + this.numBigParks; i++) {
                        this.bigParks.push(polygons[i]);
                    }
                }
                else {
                    for (let i = 0; i < this.numBigParks; i++) {
                        const parkIndex = Math.floor(Math.random() * polygons.length);
                        this.bigParks.push(polygons[parkIndex]);
                    }
                }
            }
            else {
                this.bigParks.push(...polygons);
            }
        }
        else {
            // Small parks
            this.smallParks = [];
            for (let i = 0; i < this.numSmallParks; i++) {
                const parkIndex = Math.floor(Math.random() * polygons.length);
                this.smallParks.push(polygons[parkIndex]);
            }
        }
        this.tensorField.parks = [];
        this.tensorField.parks.push(...this.bigParks);
        this.tensorField.parks.push(...this.smallParks);
    }
    // add to export json
    exportToJsonFile(jsonData, filename) {
        const dataStr = JSON.stringify(jsonData);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = filename + '.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    async generateEverything() {
        this.coastline.generateRoads();
        await this.mainRoads.generateRoads();
        await this.majorRoads.generateRoads(this.animate);
        await this.minorRoads.generateRoads(this.animate);
        this.redraw = true;
        await this.buildings.generate(this.animate);
        console.log("generateEverything(),this=",this)
        return {
            coastline: this.coastline.coastline,
            seaPolygon: this.coastline.seaPolygon,
            river: this.coastline.river,
            secondaryRiver: this.coastline.secondaryRiver,
            majorRoads: this.majorRoads.roads,
            mainRoads: this.mainRoads.roads,
            minorRoads: this.minorRoads.roads,
            bigParks: this.bigParks,
            smallParks: this.smallParks,
            intersections: this.intersections,
            blocks: await this.buildings.getBlocks()
        };
    }
    update() {
        let continueUpdate = true;
        const start = performance.now();
        while (continueUpdate && performance.now() - start < this.animationSpeed) {
            const minorChanged = this.minorRoads.update();
            const majorChanged = this.majorRoads.update();
            const mainChanged = this.mainRoads.update();
            const buildingsChanged = this.buildings.update();
            continueUpdate = minorChanged || majorChanged || mainChanged || buildingsChanged;
        }
        this.redraw = this.redraw || continueUpdate;
    }
    draw(style, forceDraw = false, customCanvas) {
        if (!style.needsUpdate && !forceDraw && !this.redraw && !this.domainController.moved) {
            return;
        }
        style.needsUpdate = false;
        this.domainController.moved = false;
        this.redraw = false;
        style.seaPolygon = this.coastline.seaPolygon;
        style.coastline = this.coastline.coastline;
        style.river = this.coastline.river;
        style.lots = this.buildings.lots;
        if (style instanceof DefaultStyle && style.showBuildingModels) {
            style.buildingModels = this.buildings.models;
        }
        style.parks = [];
        style.parks.push(...this.bigParks.map(p => p.map(v => this.domainController.worldToScreen(v.clone()))));
        style.parks.push(...this.smallParks.map(p => p.map(v => this.domainController.worldToScreen(v.clone()))));
        style.minorRoads = this.minorRoads.roads;
        style.majorRoads = this.majorRoads.roads;
        style.mainRoads = this.mainRoads.roads;
        style.coastlineRoads = this.coastline.roads;
        style.secondaryRiver = this.coastline.secondaryRiver;
        style.draw(customCanvas);
    }
    roadsEmpty() {
        return this.majorRoads.roadsEmpty()
            && this.minorRoads.roadsEmpty()
            && this.mainRoads.roadsEmpty()
            && this.coastline.roadsEmpty();
    }
    // OBJ Export methods
    get seaPolygon() {
        return this.coastline.seaPolygon;
    }
    get riverPolygon() {
        return this.coastline.river;
    }
    get buildingModels() {
        return this.buildings.models;
    }
    getBlocks() {
        return this.buildings.getBlocks();
    }
    get minorRoadPolygons() {
        return this.minorRoads.roads.map(r => PolygonUtil.resizeGeometry(r, 1 * this.domainController.zoom, false));
    }
    get majorRoadPolygons() {
        return this.majorRoads.roads.concat([this.coastline.secondaryRiver]).map(r => PolygonUtil.resizeGeometry(r, 2 * this.domainController.zoom, false));
    }
    get mainRoadPolygons() {
        return this.mainRoads.roads.concat(this.coastline.roads).map(r => PolygonUtil.resizeGeometry(r, 2.5 * this.domainController.zoom, false));
    }
    get coastlinePolygon() {
        return PolygonUtil.resizeGeometry(this.coastline.coastline, 15 * this.domainController.zoom, false);
    }
}
