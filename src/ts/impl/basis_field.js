import Tensor from './tensor';
;
console.log("-------------------");
console.log("basis_field.ts running!");
/**
 * Grid or Radial field to be combined with others to create the tensor field
 */
export class BasisField {
    constructor(centre, _size, _decay) {
        this._size = _size;
        this._decay = _decay;
        this._centre = centre.clone();
    }
    set centre(centre) {
        this._centre.copy(centre);
    }
    get centre() {
        return this._centre.clone();
    }
    set decay(decay) {
        this._decay = decay;
    }
    set size(size) {
        this._size = size;
    }
    dragStartListener() {
        this.setFolder();
    }
    dragMoveListener(delta) {
        // Delta assumed to be in world space (only relevant when zoomed)
        this._centre.add(delta);
    }
    getWeightedTensor(point, smooth) {
        return this.getTensor(point).scale(this.getTensorWeight(point, smooth));
    }
    setFolder() {
        if (this.parentFolder.__folders) {
            for (const folderName in this.parentFolder.__folders) {
                this.parentFolder.__folders[folderName].close();
            }
            this.folder.open();
        }
    }
    removeFolderFromParent() {
        if (this.parentFolder.__folders && Object.values(this.parentFolder.__folders).indexOf(this.folder) >= 0) {
            this.parentFolder.removeFolder(this.folder);
        }
    }
    /**
     * Creates a folder and adds it to the GUI to control params
     */
    setGui(parent, folder) {
        this.parentFolder = parent;
        this.folder = folder;
        folder.add(this._centre, 'x');
        folder.add(this._centre, 'y');
        folder.add(this, '_size');
        folder.add(this, '_decay', -50, 50);
    }
    /**
     * Interpolates between (0 and 1)^decay
     */
    getTensorWeight(point, smooth) {
        const normDistanceToCentre = point.clone().sub(this._centre).length() / this._size;
        if (smooth) {
            return normDistanceToCentre ** -this._decay;
        }
        // Stop (** 0) turning weight into 1, filling screen even when outside 'size'
        if (this._decay === 0 && normDistanceToCentre >= 1) {
            return 0;
        }
        return Math.max(0, (1 - normDistanceToCentre)) ** this._decay;
    }
}
BasisField.folderNameIndex = 0;
export class Grid extends BasisField {
    constructor(centre, size, decay, _theta) {
        super(centre, size, decay);
        this._theta = _theta;
        this.FOLDER_NAME = `Grid ${Grid.folderNameIndex++}`;
        this.FIELD_TYPE = 1 /* FIELD_TYPE.Grid */;
    }
    set theta(theta) {
        this._theta = theta;
    }
    setGui(parent, folder) {
        super.setGui(parent, folder);
        // GUI in degrees, convert to rads
        const thetaProp = { theta: this._theta * 180 / Math.PI };
        const thetaController = folder.add(thetaProp, 'theta', -90, 90);
        thetaController.onChange(theta => this._theta = theta * (Math.PI / 180));
    }
    getTensor(point) {
        const cos = Math.cos(2 * this._theta);
        const sin = Math.sin(2 * this._theta);
        return new Tensor(1, [cos, sin]);
    }
}
export class Radial extends BasisField {
    constructor(centre, size, decay) {
        super(centre, size, decay);
        this.FOLDER_NAME = `Radial ${Radial.folderNameIndex++}`;
        this.FIELD_TYPE = 0 /* FIELD_TYPE.Radial */;
    }
    getTensor(point) {
        const t = point.clone().sub(this._centre);
        const t1 = t.y ** 2 - t.x ** 2;
        const t2 = -2 * t.x * t.y;
        return new Tensor(1, [t1, t2]);
    }
}
