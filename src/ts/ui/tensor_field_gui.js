import DomainController from './domain_controller';
import TensorField from '../impl/tensor_field';
import Util from '../util';
import Vector from '../vector';
console.log("--------------------");
console.log("tensor_field_gui.ts is running");
/**
 * Extension of TensorField that handles interaction with dat.GUI
 */
export default class TensorFieldGUI extends TensorField {
    constructor(guiFolder, dragController, drawCentre, noiseParams) {
        super(noiseParams);
        this.guiFolder = guiFolder;
        this.dragController = dragController;
        this.drawCentre = drawCentre;
        this.TENSOR_LINE_DIAMETER = 20;
        this.TENSOR_SPAWN_SCALE = 0.7; // How much to shrink worldDimensions to find spawn point
        this.domainController = DomainController.getInstance();
        // For custom naming of gui buttons
        const tensorFieldGuiObj = {
            reset: () => this.reset(),
            setRecommended: () => this.setRecommended(),
            addRadial: () => this.addRadialRandom(),
            addGrid: () => this.addGridRandom(),
        };
        this.guiFolder.add(tensorFieldGuiObj, 'reset');
        this.guiFolder.add(this, 'smooth');
        this.guiFolder.add(tensorFieldGuiObj, 'setRecommended');
        this.guiFolder.add(tensorFieldGuiObj, 'addRadial');
        this.guiFolder.add(tensorFieldGuiObj, 'addGrid');
    }
    /**
     * 4 Grids, one radial
     */
    setRecommended() {
        this.reset();
        const size = this.domainController.worldDimensions.multiplyScalar(this.TENSOR_SPAWN_SCALE);
        const newOrigin = this.domainController.worldDimensions
            .multiplyScalar((1 - this.TENSOR_SPAWN_SCALE) / 2)
            .add(this.domainController.origin);
        this.addGridAtLocation(newOrigin);
        this.addGridAtLocation(newOrigin.clone().add(size));
        this.addGridAtLocation(newOrigin.clone().add(new Vector(size.x, 0)));
        this.addGridAtLocation(newOrigin.clone().add(new Vector(0, size.y)));
        this.addRadialRandom();
    }
    addRadialRandom() {
        const width = this.domainController.worldDimensions.x;
        this.addRadial(this.randomLocation(), Util.randomRange(width / 10, width / 5), // Size
        Util.randomRange(50)); // Decay
    }
    addGridRandom() {
        this.addGridAtLocation(this.randomLocation());
    }
    addGridAtLocation(location) {
        const width = this.domainController.worldDimensions.x;
        this.addGrid(location, Util.randomRange(width / 4, width), // Size
        Util.randomRange(50), // Decay
        Util.randomRange(Math.PI / 2));
    }
    /**
     * World-space random location for tensor field spawn
     * Sampled from middle of screen (shrunk rectangle)
     */
    randomLocation() {
        const size = this.domainController.worldDimensions.multiplyScalar(this.TENSOR_SPAWN_SCALE);
        const location = new Vector(Math.random(), Math.random()).multiply(size);
        const newOrigin = this.domainController.worldDimensions.multiplyScalar((1 - this.TENSOR_SPAWN_SCALE) / 2);
        return location.add(this.domainController.origin).add(newOrigin);
    }
    getCrossLocations() {
        // Gets grid of points for vector field vis in world space
        const diameter = this.TENSOR_LINE_DIAMETER / this.domainController.zoom;
        const worldDimensions = this.domainController.worldDimensions;
        const nHor = Math.ceil(worldDimensions.x / diameter) + 1; // Prevent pop-in
        const nVer = Math.ceil(worldDimensions.y / diameter) + 1;
        const originX = diameter * Math.floor(this.domainController.origin.x / diameter);
        const originY = diameter * Math.floor(this.domainController.origin.y / diameter);
        const out = [];
        for (let x = 0; x <= nHor; x++) {
            for (let y = 0; y <= nVer; y++) {
                out.push(new Vector(originX + (x * diameter), originY + (y * diameter)));
            }
        }
        return out;
    }
    getTensorLine(point, tensorV) {
        const transformedPoint = this.domainController.worldToScreen(point.clone());
        const diff = tensorV.multiplyScalar(this.TENSOR_LINE_DIAMETER / 2); // Assumes normalised
        const start = transformedPoint.clone().sub(diff);
        const end = transformedPoint.clone().add(diff);
        return [start, end];
    }
    draw(canvas) {
        // Draw tensor field
        canvas.setFillStyle('black');
        canvas.clearCanvas();
        canvas.setStrokeStyle('white');
        canvas.setLineWidth(1);
        const tensorPoints = this.getCrossLocations();
        // // output parameters
        // // fields
        // console.log("this.getBasisFields() has location of control points",this.getBasisFields());
        // // tensorPoints
        // console.log("tensorPoints=",tensorPoints);
        // // tensorPoints Lines
        // tensorPoints.forEach(p => {
        //     const t = this.samplePoint(p);
        //     console.log("this.getTensorLine(p, t.getMajor())",this.getTensorLine(p, t.getMajor()));
        //     console.log("this.getTensorLine(p, t.getMinor())",this.getTensorLine(p, t.getMinor()));
        // });
        // here is to draw the polyline
        tensorPoints.forEach(p => {
            const t = this.samplePoint(p);
            canvas.drawPolyline(this.getTensorLine(p, t.getMajor()));
            canvas.drawPolyline(this.getTensorLine(p, t.getMinor()));
        });
        // Draw centre points of fields
        // modified for no domainController
        if (this.drawCentre) {
            canvas.setFillStyle('red');
            // console.log("field.centre=",this.getBasisFields());
            this.getBasisFields().forEach(field => field.FIELD_TYPE === 1 /* FIELD_TYPE.Grid */ ?
                canvas.drawSquare(field.centre, 7) :
                canvas.drawCircle(field.centre, 7));
        }
    }
    addField(field) {
        super.addField(field);
        const folder = this.guiFolder.addFolder(`${field.FOLDER_NAME}`);
        // Function to deregister from drag controller
        const deregisterDrag = this.dragController.register(() => field.centre, field.dragMoveListener.bind(field), field.dragStartListener.bind(field));
        const removeFieldObj = { remove: () => this.removeFieldGUI(field, deregisterDrag) };
        // Give dat gui removeField button
        folder.add(removeFieldObj, 'remove');
        field.setGui(this.guiFolder, folder);
    }
    removeFieldGUI(field, deregisterDrag) {
        super.removeField(field);
        field.removeFolderFromParent();
        // Deregister from drag controller
        deregisterDrag();
    }
    reset() {
        // TODO kind of hacky - calling remove callbacks from gui object, should store callbacks
        // in addfield and call them (requires making sure they're idempotent)
        for (const fieldFolderName in this.guiFolder.__folders) {
            const fieldFolder = this.guiFolder.__folders[fieldFolderName];
            fieldFolder.__controllers[0].initialValue();
        }
        super.reset();
    }
}
