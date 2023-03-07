import Dimension from './dimension';
import * as THREE from 'three';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { getArea, getCenter } from '../math/math-tools.js';
import LineMaterials from '../materials/line-materials';
import { convertPtToTHREEVector } from '../boundary/utils';

class SiteDimensions {
  constructor(editor) {
    this.editor = editor;
    this.dims = [];
    this.divEl = document.createElement('div');
    this.divEl.setAttribute('id', 'site-dims');
    document.body.appendChild(this.divEl);
    this.lines = [];
  }

  activateAnnotation(selectedItems = [], sites = this.editor.state.specimen.sites) {
    const keys =
      selectedItems.length > 0 ? Object.keys(sites).filter((k) => selectedItems.indexOf(k) !== -1) : Object.keys(sites);

    for (const key of keys) {
      const site = sites[key];
      const shape = [...site.shape];
      let prevPt = null;
      if (!convertPtToTHREEVector(shape[0]).equals(convertPtToTHREEVector(shape[shape.length - 1]))) {
        shape.push(shape[0]);
      }
      shape.forEach((point) => {
        point = convertPtToTHREEVector(point);
        if (prevPt) {
          const measure = prevPt.distanceTo(point);
          const midPoint = new THREE.Vector3(
            (prevPt.x + point.x) / 2,
            (prevPt.y + point.y) / 2,
            (prevPt.z + point.z) / 2
          );

          this.dims.push(new Dimension(this.dims.length, midPoint, Math.round(measure, 2), 'site-dims'));
        }
        prevPt = point;
      });
      const area = getArea(shape);
      const center = getCenter(shape);
      this.dims.push(new Dimension(this.dims.length, center, Math.round(area, 2), 'site-dims', 'dimArea'));
      this.drawOutLine(shape);
    }
  }

  deactivateAnnotation() {
    for (let i = 0; i < this.dims.length; i++) {
      this.dims[i].clear();
    }
    for (let i = 0; i < this.lines.length; i++) {
      this.editor.viewport.scene.remove(this.lines[i]);
      this.lines[i].geometry.dispose();
      this.lines[i].material.dispose();
    }
    this.dims = [];
  }

  updateSiteDims = () => {
    for (let j = 0; j < this.dims.length; j++) {
      const screenPosition = this.dims[j].position.clone();
      screenPosition.project(this.editor.viewport.camera);
      this.dims[j].setDimPosition(screenPosition);
    }
  };

  drawOutLine = (polygon) => {
    let position = [];

    for (let i = 0; i < polygon.length; i++) {
      position.push(polygon[i].x);
      position.push(polygon[i].y);
      position.push(polygon[i].z);
    }

    const lineGeometry = new LineGeometry().setPositions(position);
    const line = new Line2(lineGeometry, LineMaterials.blueLine);
    line.renderOrder = 1;
    this.editor.viewport.scene.add(line);
    this.lines.push(line);
  };
}

export default SiteDimensions;
