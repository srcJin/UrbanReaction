// import fitCurve from 'fit-curve';
import * as THREE from 'three';
import { fitCurve } from './fit-curve';
import { v4 as uuidv4 } from 'uuid';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { Bezier } from './bezier';
import { findInRanges } from './math/math-tools';
import LineMaterials from './materials/line-materials';

export class Polybezier {
  constructor(freehandLines, maxError) {
    this.uuid = uuidv4();
    this.beziers = [];
    this.original = freehandLines;
    this.drawControls = true;
    this.fidelity = 10;
    this.mesh = null;
    this.controlPointMeshes = [];
    this.controlGuideLines = [];
    this.fromPolyline(freehandLines, maxError);
    this.analyze();
    this.getControlPoints();
    this.isPolyBezier = true;
  }
  restore = (polybezier) => {};

  getControlPoints = () => {
    this.controlPoints = [];
    for (let i = 0; i < this.beziers.length; i++) {
      const bez = this.beziers[i];
      for (let j = 0; j < 4; j++) {
        bez.points[j].reference = {
          index: j,
          parent: i,
          polybezierID: this.uuid,
        };
      }
      if (i < this.beziers.length - 2) bez.points[3].reference.sibling = this.beziers[i + 1].points[0];
      if (i > 0) bez.points[0].reference.sibling = this.beziers[i - 1].points[3];

      this.controlPoints.push(bez.points[0], bez.points[1], bez.points[2]);
      if (i === this.beziers.length - 1) {
        this.controlPoints.push(bez.points[3]);
      }
    }
    let prevPt;
    let positions = [];
    let sisterStartControl;
    let prevControl;
    let ptIndex = 0;
    this.controlPoints.forEach((pt) => {
      const geometry = new THREE.SphereGeometry(1);

      const bigSphereGeometry = new THREE.SphereGeometry(1.5);

      const sphere = new THREE.Mesh(geometry, LineMaterials.whiteMesh);
      const bigSphere = new THREE.Mesh(bigSphereGeometry, LineMaterials.borderMaterial);
      bigSphere.visible = false;
      sphere.renderOrder = 1;

      bigSphere.add(sphere);
      // const geometry = new THREE.BoxGeometry(2, 2, 2);
      // const material = new THREE.MeshStandardMaterial({ color: 0x666666 });
      // const cube = new THREE.Mesh(geometry, material);
      // cube.translateX(pt.x);
      // cube.translateZ(pt.z);
      bigSphere.translateX(pt.x);
      bigSphere.translateZ(pt.z);
      bigSphere.recipe = pt;
      bigSphere.dependents = [];
      this.controlPointMeshes.push(bigSphere);

      // draw guidelines that connect the control points
      if (!prevPt) {
        prevPt = pt;
        prevControl = bigSphere;
        ptIndex++;
        positions.push(prevPt.x, prevPt.y, prevPt.z);
        if (ptIndex !== 0) {
          // If pt is the start point, it is an anchor instead of a sister
          sisterStartControl = bigSphere;
        }
        return;
      }

      positions.push(pt.x, pt.y, pt.z);

      if (ptIndex % 3 === 1 || ptIndex === this.controlPoints.length - 1) {
        if (ptIndex === 1) {
          bigSphere.sister = null;
          console.log('PREV CONTROL ', prevControl);
          prevControl.dependents.push(bigSphere);
          prevControl.prevPosition = prevControl.position.clone();
        } else if (ptIndex % 3 === 1) {
          bigSphere.sister = sisterStartControl;
          sisterStartControl.sister = bigSphere;
          //assign middle control point as anchor to the sisters
          bigSphere.anchor = prevControl;
          sisterStartControl.anchor = prevControl;
          // store the
          prevControl.dependents.push(sisterStartControl, bigSphere);
          prevControl.prevPosition = prevControl.position.clone();
        } else if (ptIndex === this.controlPoints.length - 1) {
          sisterStartControl.sister = null;
          bigSphere.dependents.push(sisterStartControl);
          bigSphere.prevPosition = bigSphere.position.clone();
        }
        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions(positions);
        // geometry.setColors(colors);
        const line = new Line2(lineGeometry, LineMaterials.dashedLineMaterial);
        line.computeLineDistances();
        line.visible = false;

        this.controlGuideLines.push(line);
        positions = [];
        prevPt = null;
        ptIndex++;
        positions = [];
        return;
      }
      ptIndex++;
      prevPt = pt;
      prevControl = bigSphere;
    });
  };
  updateControlGuideLines() {
    this.controlGuideLines = [];
    let ptIndex = 0;
    let prevPt;
    var positions = [];
    this.controlPoints.forEach((pt) => {
      // draw guidelines that connect the control points
      if (!prevPt) {
        prevPt = pt;
        ptIndex++;
        positions.push(prevPt.x, prevPt.y, prevPt.z);
        return;
      }

      positions.push(pt.x, pt.y, pt.z);

      if (ptIndex % 3 === 1 || ptIndex === this.controlPoints.length - 1) {
        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions(positions);
        // geometry.setColors(colors);
        const line = new Line2(lineGeometry, LineMaterials.dashedLineMaterial);
        line.computeLineDistances();
        line.visible = true;

        this.controlGuideLines.push(line);
        // positions = [];
        prevPt = null;
        ptIndex++;
        positions = [];
        return;
      }
      ptIndex++;
      prevPt = pt;
    });
  }
  fromPolyline(polyline, maxError) {
    const cleaned = polyline.map((pt) => ({
      x: parseInt(pt.x),
      y: parseInt(pt.z),
    }));

    const controlPts = fitCurve(cleaned, maxError);

    for (const pts of controlPts) {
      const bez = new Bezier(
        pts[0].x,
        0,
        pts[0].y,
        pts[1].x,
        0,
        pts[1].y,
        pts[2].x,
        0,
        pts[2].y,
        pts[3].x,
        0,
        pts[3].y
      );
      this.beziers.push(bez);
    }
  }
  analyze() {
    const scope = this;
    scope._length = 0;
    this.beziers.forEach((bez) => {
      bez._length = bez.length();
      scope._length += bez._length;
    });
  }
  //TODO: function findInRanges  returns null
  evaluate(t) {
    t = t < 0 ? 0 : t;
    t = t > 1 ? 1 : t;
    const dist = this._length * t;
    const lengths = this.beziers.map((b) => b._length);
    const range = findInRanges(dist, lengths);
    if (range) {
      const { index, remainder } = range;
      const t_local = remainder / this.beziers[index]._length;
      return this.beziers[index].get(t_local);
    }
    return null;
  }
  offset(d) {
    const offsets = this.beziers.map((b) => b.offset(d));
    return offsets.flat();
  }

  getPolylineFromBezier(nPts) {
    const polyline = [];
    for (let i = 0; i < nPts; i++) {
      const pt = this.evaluate(i / nPts);
      // console.log('Pt is:: ', pt);
      if (pt) polyline.push(pt);
    }
    return polyline;
  }

  build(nPts, mat) {
    const positions = [];
    // const color = new THREE.Color();

    for (let i = 0; i < nPts; i++) {
      const pt = this.evaluate(i / nPts);
      if (pt) positions.push(pt.x, pt.y, pt.z);
    }
    const geometry = new LineGeometry();
    if (positions.length == 0) {
      return;
    }
    geometry.setPositions(positions);
    // geometry.setColors(colors);
    this.mesh = new Line2(geometry, mat);
    // this.mesh.computeLineDistances();
    this.mesh.scale.set(1, 1, 1);
  }
}
