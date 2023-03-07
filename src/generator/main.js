import 'babel-polyfill';
// import * as log from 'loglevel';
import * as dat from 'dat.gui';
import TensorFieldGUI from './ui/tensor_field_gui';
import MainGUI from './ui/main_gui';
import { DefaultCanvasWrapper } from './ui/canvas_wrapper';
import Util from './util';
import DragController from './ui/drag_controller';
import { DefaultStyle } from './ui/style';
import * as ColourSchemes from '../colour_schemes.json';
// import { saveAs } from 'file-saver';
console.log("--------------------");
console.log("main.ts is running");
class MainGenerator {
    constructor() {
        this.STARTING_WIDTH = 500; // Initially zooms in if width > STARTING_WIDTH
        // UI
        this.gui = new dat.GUI({ width: 300 });
        // private downloadsFolder: dat.GUI;
        // private domainController = DomainController.getInstance();
        this.dragController = new DragController(this.gui);
        // Options
        // private imageScale = 3;  // Multiplier for res of downloaded image
        this.highDPI = true; // Increases resolution for hiDPI displays
        this.colourScheme = "Default"; // See colour_schemes.json
        this.zoomBuildings = false; // Show buildings only when zoomed in?
        this.buildingModels = false; // Draw pseudo-3D buildings?
        this.showFrame = false;
        // Force redraw of roads when switching from tensor vis to map vis
        this.previousFrameDrawTensor = true;
        // 3D camera position
        this.cameraX = 0;
        this.cameraY = 0;
        this.firstGenerate = true; // Don't randomise tensor field on first generate
        // GUI Setup
        // const zoomController = this.gui.add(this.domainController, 'zoom');
        // this.domainController.setZoomUpdate(() => zoomController.updateDisplay());
        this.gui.add(this, 'generateAll');
        this.tensorFolder = this.gui.addFolder('Tensor Field');
        this.roadsFolder = this.gui.addFolder('Map');
        this.styleFolder = this.gui.addFolder('Style');
        this.optionsFolder = this.gui.addFolder('Options');
        // this.downloadsFolder = this.gui.addFolder('Download');
        // Canvas setup
        this.canvas = document.getElementById(Util.CANVAS_ID);
        this.tensorCanvas = new DefaultCanvasWrapper(this.canvas);
        // Make sure we're not too zoomed out for large resolutions
        // console.log("this.domainController=",this.domainController)
        // const screenWidth = this.domainController.screenDimensions.x;
        // if (screenWidth > this.STARTING_WIDTH) {
        //     this.domainController.zoom = screenWidth / this.STARTING_WIDTH;
        // }
        // Style setup
        this.styleFolder.add(this, 'colourScheme', Object.keys(ColourSchemes)).onChange((val) => this.changeColourScheme(val));
        this.styleFolder.add(this, 'zoomBuildings').onChange((val) => {
            // Force redraw
            this.previousFrameDrawTensor = true;
            this._style.zoomBuildings = val;
        });
        this.styleFolder.add(this, 'buildingModels').onChange((val) => {
            // Force redraw
            this.previousFrameDrawTensor = true;
            this._style.showBuildingModels = val;
        });
        this.styleFolder.add(this, 'showFrame').onChange((val) => {
            this.previousFrameDrawTensor = true;
            this._style.showFrame = val;
        });
        // this.styleFolder.add(this.domainController, 'orthographic');
        // this.styleFolder.add(this, 'cameraX', -15, 15).step(1).onChange(() => this.setCameraDirection());
        // this.styleFolder.add(this, 'cameraY', -15, 15).step(1).onChange(() => this.setCameraDirection());
        const noiseParamsPlaceholder = {
            globalNoise: false,
            noiseSizePark: 20,
            noiseAnglePark: 90,
            noiseSizeGlobal: 30,
            noiseAngleGlobal: 20
        };
        this.tensorField = new TensorFieldGUI(this.tensorFolder, this.dragController, true, noiseParamsPlaceholder);
        this.mainGui = new MainGUI(this.roadsFolder, this.tensorField, () => this.tensorFolder.close());
        this.optionsFolder.add(this.tensorField, 'drawCentre');
        this.optionsFolder.add(this, 'highDPI').onChange((high) => this.changeCanvasScale(high));
        this.changeColourScheme(this.colourScheme);
        this.tensorField.setRecommended();
        requestAnimationFrame(() => this.update());
    }
    /**
     * Generate an entire map with no control over the process
     */
    generateAll() {
        if (!this.firstGenerate) {
            this.tensorField.setRecommended();
        }
        else {
            this.firstGenerate = false;
        }
        this.mainGui.generateEverything();
    }
    // added for switch to not firstGenerate
    mySetFirstGenerateFalse() {
        this.firstGenerate = false;
    }
    // added to generate
    myGenerate() {
        const objects = this.mainGui.generateEverything();
        return objects;
    }
    /**
     * @param {string} scheme Matches a scheme name in colour_schemes.json
     */
    changeColourScheme(scheme) {
        const colourScheme = ColourSchemes[scheme];
        this.zoomBuildings = colourScheme.zoomBuildings;
        this.buildingModels = colourScheme.buildingModels;
        Util.updateGui(this.styleFolder);
        // if (scheme.startsWith("Drawn")) {
        //     this._style = new RoughStyle(this.canvas, this.dragController, Object.assign({}, colourScheme));
        // } else {
        this._style = new DefaultStyle(this.canvas, this.dragController, Object.assign({}, colourScheme), scheme.startsWith("Heightmap"));
        // }
        this._style.showFrame = this.showFrame;
        this.changeCanvasScale(this.highDPI);
    }
    /**
     * Scale up canvas resolution for hiDPI displays
     */
    changeCanvasScale(high) {
        const value = high ? 2 : 1;
        this._style.canvasScale = value;
        this.tensorCanvas.canvasScale = value;
    }
    // /**
    //  * Change camera position for pseudo3D buildings
    //  */
    // setCameraDirection(): void {
    //     this.domainController.cameraDirection = new Vector(this.cameraX / 10, this.cameraY / 10);
    // }
    showTensorField() {
        return !this.tensorFolder.closed || this.mainGui.roadsEmpty();
    }
    draw() {
        if (this.showTensorField()) {
            this.previousFrameDrawTensor = true;
            this.dragController.setDragDisabled(false);
            this.tensorField.draw(this.tensorCanvas);
        }
        else {
            // Disable field drag and drop
            this.dragController.setDragDisabled(true);
            if (this.previousFrameDrawTensor === true) {
                this.previousFrameDrawTensor = false;
                // Force redraw if switching from tensor field
                this.mainGui.draw(this._style, true);
            }
            else {
                this.mainGui.draw(this._style);
            }
        }
    }
    update() {
        if (this.modelGenerator) {
            let continueUpdate = true;
            const start = performance.now();
            while (continueUpdate && performance.now() - start < 100) {
                continueUpdate = this.modelGenerator.update();
            }
        }
        this._style.update();
        this.mainGui.update();
        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }
}
// Add log to window so we can use log.setlevel from the console
// (window as any).log = log;
// window.addEventListener('load', (): void => {
//     new MainGenerator();
// });
// add functions for API
export const myGenerator = new MainGenerator();
// console.log("myGenerator", myGenerator);
// console.log("myGenerator.tensorField", myGenerator.tensorField);
//addRadial(centre: Vector, size: number, decay: number)
// myGenerator.tensorField.addRadial(new Vector(400,400), 400, 10)
//addGrid(centre: Vector, size: number, decay: number, theta: number)
// myGenerator.tensorField.addGrid(new Vector(200,200), 100, 1, 0.5)
// const lastField = myGenerator.tensorField.getBasisFields()[-1]
// console.log("myGenerator.tensorFieldAfter",myGenerator.tensorField);
