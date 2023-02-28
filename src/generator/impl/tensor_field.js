// import * as log from 'loglevel';
// import * as noise from 'noisejs';
// import * as SimplexNoise from 'simplex-noise';
import SimplexNoise from 'simplex-noise';
import Tensor from './tensor';
import { Grid, Radial } from './basis_field';
import PolygonUtil from './polygon_util';
console.log("-------------------");
console.log("tensor_field.ts running!");
/**
 * Combines basis fields
 * Noise added when sampling a point in a park
 */
export default class TensorField {
    constructor(noiseParams) {
        this.noiseParams = noiseParams;
        // changed from private to public
        this.basisFields = [];
        this.parks = [];
        this.sea = [];
        this.river = [];
        this.ignoreRiver = false;
        // changed
        this.smooth = true;
        this.noise = new SimplexNoise();
    }
    /**
     * Used when integrating coastline and river
     */
    enableGlobalNoise(angle, size) {
        this.noiseParams.globalNoise = true;
        this.noiseParams.noiseAngleGlobal = angle;
        this.noiseParams.noiseSizeGlobal = size;
    }
    disableGlobalNoise() {
        this.noiseParams.globalNoise = false;
    }
    addGrid(centre, size, decay, theta) {
        const grid = new Grid(centre, size, decay, theta);
        this.addField(grid);
    }
    addRadial(centre, size, decay) {
        const radial = new Radial(centre, size, decay);
        this.addField(radial);
    }
    addField(field) {
        this.basisFields.push(field);
    }
    // changed from private to public
    removeField(field) {
        const index = this.basisFields.indexOf(field);
        if (index > -1) {
            this.basisFields.splice(index, 1);
        }
    }
    reset() {
        this.basisFields = [];
        this.parks = [];
        this.sea = [];
        this.river = [];
    }
    getCentrePoints() {
        return this.basisFields.map(field => field.centre);
    }
    getBasisFields() {
        return this.basisFields;
    }
    samplePoint(point) {
        if (!this.onLand(point)) {
            // Degenerate point
            return Tensor.zero;
        }
        // Default field is a grid
        if (this.basisFields.length === 0) {
            return new Tensor(1, [0, 0]);
        }
        const tensorAcc = Tensor.zero;
        this.basisFields.forEach(field => tensorAcc.add(field.getWeightedTensor(point, this.smooth), this.smooth));
        // Add rotational noise for parks - range -pi/2 to pi/2
        if (this.parks.some(p => PolygonUtil.insidePolygon(point, p))) {
            // TODO optimise insidePolygon e.g. distance
            tensorAcc.rotate(this.getRotationalNoise(point, this.noiseParams.noiseSizePark, this.noiseParams.noiseAnglePark));
        }
        if (this.noiseParams.globalNoise) {
            tensorAcc.rotate(this.getRotationalNoise(point, this.noiseParams.noiseSizeGlobal, this.noiseParams.noiseAngleGlobal));
        }
        return tensorAcc;
    }
    /**
     * Noise Angle is in degrees
     */
    getRotationalNoise(point, noiseSize, noiseAngle) {
        return this.noise.noise2D(point.x / noiseSize, point.y / noiseSize) * noiseAngle * Math.PI / 180;
    }
    onLand(point) {
        const inSea = PolygonUtil.insidePolygon(point, this.sea);
        if (this.ignoreRiver) {
            return !inSea;
        }
        return !inSea && !PolygonUtil.insidePolygon(point, this.river);
    }
    inParks(point) {
        for (const p of this.parks) {
            if (PolygonUtil.insidePolygon(point, p))
                return true;
        }
        return false;
    }
}
