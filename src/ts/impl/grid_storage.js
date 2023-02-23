// import * as log from 'loglevel';
import Vector from '../vector';
// import * as dat from 'dat.gui';
console.log("-------------------");
console.log("grid_storage.ts running!");
/**
 * Cartesian grid accelerated data structure
 * Grid of cells, each containing a list of vectors
 */
export default class GridStorage {
    /**
     * worldDimensions assumes origin of 0,0
     * @param {number} dsep Separation distance between samples
     */
    constructor(worldDimensions, origin, dsep) {
        this.worldDimensions = worldDimensions;
        this.origin = origin;
        this.dsep = dsep;
        this.dsepSq = this.dsep * this.dsep;
        this.gridDimensions = worldDimensions.clone().divideScalar(this.dsep);
        this.grid = [];
        for (let x = 0; x < this.gridDimensions.x; x++) {
            this.grid.push([]);
            for (let y = 0; y < this.gridDimensions.y; y++) {
                this.grid[x].push([]);
            }
        }
    }
    /**
     * Add all samples from another grid to this one
     */
    addAll(gridStorage) {
        for (const row of gridStorage.grid) {
            for (const cell of row) {
                for (const sample of cell) {
                    this.addSample(sample);
                }
            }
        }
    }
    addPolyline(line) {
        for (const v of line) {
            this.addSample(v);
        }
    }
    /**
     * Does not enforce separation
     * Does not clone
     */
    addSample(v, coords) {
        if (!coords) {
            coords = this.getSampleCoords(v);
        }
        this.grid[coords.x][coords.y].push(v);
    }
    /**
     * Tests whether v is at least d away from samples
     * Performance very important - this is called at every integration step
     * @param dSq=this.dsepSq squared test distance
     * Could be dtest if we are integrating a streamline
     */
    isValidSample(v, dSq = this.dsepSq) {
        // Code duplication with this.getNearbyPoints but much slower when calling
        // this.getNearbyPoints due to array creation in that method
        const coords = this.getSampleCoords(v);
        // Check samples in 9 cells in 3x3 grid
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const cell = coords.clone().add(new Vector(x, y));
                if (!this.vectorOutOfBounds(cell, this.gridDimensions)) {
                    if (!this.vectorFarFromVectors(v, this.grid[cell.x][cell.y], dSq)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * Test whether v is at least d away from vectors
     * Performance very important - this is called at every integration step
     * @param {number}   dSq     squared test distance
     */
    vectorFarFromVectors(v, vectors, dSq) {
        for (const sample of vectors) {
            if (sample !== v) {
                const distanceSq = sample.distanceToSquared(v);
                if (distanceSq < dSq) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Returns points in cells surrounding v
     * Results include v, if it exists in the grid
     * @param {number} returns samples (kind of) closer than distance - returns all samples in
     * cells so approximation (square to approximate circle)
     */
    getNearbyPoints(v, distance) {
        const radius = Math.ceil((distance / this.dsep) - 0.5);
        const coords = this.getSampleCoords(v);
        const out = [];
        for (let x = -1 * radius; x <= 1 * radius; x++) {
            for (let y = -1 * radius; y <= 1 * radius; y++) {
                const cell = coords.clone().add(new Vector(x, y));
                if (!this.vectorOutOfBounds(cell, this.gridDimensions)) {
                    for (const v2 of this.grid[cell.x][cell.y]) {
                        out.push(v2);
                    }
                }
            }
        }
        return out;
    }
    worldToGrid(v) {
        return v.clone().sub(this.origin);
    }
    gridToWorld(v) {
        return v.clone().add(this.origin);
    }
    vectorOutOfBounds(gridV, bounds) {
        return (gridV.x < 0 || gridV.y < 0 ||
            gridV.x >= bounds.x || gridV.y >= bounds.y);
    }
    /**
     * @return {Vector}   Cell coords corresponding to vector
     * Performance important - called at every integration step
     */
    getSampleCoords(worldV) {
        const v = this.worldToGrid(worldV);
        if (this.vectorOutOfBounds(v, this.worldDimensions)) {
            console.log("Tried to access out-of-bounds sample in grid");
            return Vector.zeroVector();
        }
        return new Vector(Math.floor(v.x / this.dsep), Math.floor(v.y / this.dsep));
    }
}
