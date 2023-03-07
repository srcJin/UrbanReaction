import * as THREE from 'three';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { Select } from './selection/select';
import Offset from './dimensions/offset';
import { Shape, Vector2, Vector3 } from 'three';
import LineMaterials from './materials/line-materials';
import Dimension from './dimensions/dimension';
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from 'lodash';

class PolyLine {
  constructor(mouse, camera, scene, point, objectsToIntersect, raycaster, snapper, editSnapper, editor) {
    this.objectsToIntersect = objectsToIntersect;
    this.mouse = mouse;
    this.camera = camera;
    this.scene = scene;
    this.raycaster = raycaster;
    this.snapper = snapper;
    this.editSnapper = editSnapper;
    // this.flatCache = [];
    this.tempCache = [];
    this.tempLine = [];
    this.lines = [];
    this.drawing = false;
    this.point = point;
    this.editor = editor;
    this.axis = {};

    // for dimension purposes
    this.prevPt = null;
    this.dims = [];
    this.offset = [];
    this.tempDim = [];
    this.controlPointMeshes = [];
    this.activePoints = [];
    // this.intersectPt;
    // this.new = true;

    this.color = 'rgb(0,0,0)';
    this.ruler = false;
    this.knife = false;
    this.selectedLine = null;

    this.divEl = document.createElement('div');
    this.divEl.setAttribute('id', 'poly-dims');
    document.body.appendChild(this.divEl);

    this.rulerGroupId = null;

    this.undoQueue = [];
    this.redoQueue = [];
  }
  getMousePosition = (event) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  get3dPoint = (event) => {
    this.getMousePosition(event);
    const { raycaster, mouse, camera } = this;

    let objects = this.objectsToIntersect;
    if (!objects.length) return;
    let { intersects, INTERSECTED } = Select({
      raycaster,
      mouse,
      camera,
      objects,
    });
    if (intersects.length > 0) {
      const newPoint = intersects[0].point;
      return newPoint;
    }
  };

  start = (event) => {
    if (event.button !== 0 || this.editor.viewport.controls.polyLineTranslateMode) {
      // console.log('not left click');
      return;
    }

    // this.toggleOffsets(false);

    const { snapPt, intersectPt } = this.snapper;
    // console.log('MATERIAL ', Materials.orangeLine);

    let point = intersectPt;
    if (!point) {
      return;
    }
    if (snapPt) {
      point = snapPt;
    }
    // console.log('POLYLINE POINT ', point);

    if (!this.prevPt) {
      this.prevPt = point;
      this.snapper.addPointsToCache([point]);
    } else if (this.prevPt === point) {
      console.log('same point');
      return;
    } else {
      //add new line segment to cache
      this.snapper.addPointsToCache([point]);
      this.snapper.addEdgesToCache([this.prevPt, point]);
      const measure = this.prevPt.distanceTo(point);
      const midPoint = new THREE.Vector3(
        (this.prevPt.x + point.x) / 2,
        (this.prevPt.y + point.y) / 2,
        (this.prevPt.z + point.z) / 2
      );

      if (this.ruler) {
        this.dims.push(new Dimension(this.rulerGroupId, midPoint, Math.round(measure, 2), 'poly-dims'));
      }

      this.prevPt = point;
    }
    // this.new = false;
    if (!point) {
      point = this.get3dPoint(event);
    }
    // this.drawing = true;
    // add point into flat cache to act as starting point
    // this.flatCache.push(...point);
    this.lastPt = point;

    const item = this.recordLastState();
    this.undoQueue.push(item);

    if (this.tempCache > 3) {
      // clear the first three elements of tempcache to reset starting point to be the next clicked point
      this.tempCache.splice(0, 3);
      console.log(this.tempCache);
    }
    // add point into temp cache to draw the temporary line when user is in draw mode but has not clicked a second time.
    this.tempCache.push(...point);
  };

  end = () => {
    this.undoQueue = [];
    this.redoQueue = [];
    // this.drawing = false;
    // this.toggleOffsets(true);
    this.scene.remove(this.tempLine[0]);
    this.tempLine[0].geometry.dispose();
    this.tempLine[0].material.dispose();
    // remove last three elements from tempLine because there is double point
    // console.log('this.tempcache, ', this.tempCache);
    this.tempCache.splice(this.tempCache.length - 3, 3);
    // construct new permanent line
    const lineGeometry = new LineGeometry().setPositions(this.tempCache);
    // const lineMaterial = new LineMaterial({ color: this.color, linewidth: 0.005 });
    const line = new Line2(lineGeometry, this.ruler ? LineMaterials.blueLine : LineMaterials.orangeLine);
    line.renderOrder = this.ruler ? 3 : 1;
    line.userData.line = true;

    let middle = new THREE.Vector3();

    const points = [];

    for (let i = 0; i < this.tempCache.length; i += 3) {
      const pt = new Vector3(this.tempCache[i], 0, this.tempCache[i + 2]);
      points.push(pt);
    }

    if (points.length < 2) {
      this.clearIncomplete();
      return;
    }

    if (points.length % 2 === 0) {
      const point1 = points[points.length / 2 - 1];
      const point2 = points[points.length / 2];
      middle.x = (point1.x + point2.x) / 2;
      middle.y = (point1.y + point2.y) / 2;
      middle.z = (point1.z + point2.z) / 2;
    } else {
      const point1 = points[Math.floor(points.length / 2) - 1];
      const point2 = points[Math.ceil(points.length / 2) - 1];

      middle.x = (point1.x + point2.x) / 2;
      middle.y = (point1.y + point2.y) / 2;
      middle.z = (point1.z + point2.z) / 2;
    }

    if (!this.ruler && !this.knife) {
      if (this.offset.length > 0) {
        this.offset[this.offset.length - 1].hide();
      }

      this.offset.push(new Offset(line.uuid, middle, 'poly-dims', this.updateLineOffset));
    } else if (!this.knife) {
      // this.dims[this.dims.length - 1].index = line.uuid;
      for (const d of this.dims) {
        if (d.index === this.rulerGroupId) {
          d.index = line.uuid;
        }
      }

      this.rulerGroupId = uuidv4();
      line.userData.type = 'ruler';
    } else {
      line.userData.type = 'knife';
    }

    if (this.knife) {
      // if (this.planeMesh) {
      //   this.scene.remove(this.planeMesh);
      //   this.planeMesh.geometry.dispose();
      //   this.planeMesh.material.dispose();
      // }
      this.editor.cutBlock(points, this.blocks);
      //clear Dash Line
      this.snapper.tempLine.forEach((line) => {
        this.scene.remove(this.scene.getObjectById(line));
      });
      this.tempCache = [];
      this.prevPt = null;
      this.lastPt = null;
      this.editor.viewport.controls.polyLineTranslateMode = false;
      this.editor.viewport.transformControl.detach();
      return;
    }

    this.lines.push(line);
    this.scene.add(line);

    //Create control points
    this.getControlPoints(line);

    if (this.ruler || this.knife) {
      // this.axis = {
      //   ...this.axis,
      //   [line.uuid]: {
      //     type: 'polyline',
      //     points,
      //     width: this.offset[this.offset.length - 1].width,
      //   },
      // };
    } else {
      this.editor.recordStateForPencil();
      this.axis = {
        ...this.axis,
        [line.uuid]: {
          type: 'polyline',
          points,
          width: this.offset[this.offset.length - 1].width,
        },
      };
      this.editor.state.drawnElements.axis = { ...this.editor.state.drawnElements.axis, ...this.axis };
    }

    //clear Dash Line
    this.snapper.tempLine.forEach((line) => {
      this.scene.remove(this.scene.getObjectById(line));
    });

    // this.flatCache = [];
    this.tempCache = [];

    this.prevPt = null;
    this.lastPt = null;
    this.editor.viewport.controls.polyLineTranslateMode = false;
    this.editor.viewport.transformControl.detach();
    if (!this.ruler && !this.knife) {
      this.editor.divideSites();
      this.editor.updateLastUndoItem();
    }
  };

  temporaryDraw = (intersectPt, snapPt) => {
    if (!intersectPt) {
      return;
    }
    let point = intersectPt;
    if (snapPt) {
      point = snapPt;
    }
    if (!this.prevPt) {
      // console.log('no prevPt');
      return;
    }
    const measure = this.prevPt.distanceTo(point);
    const midPoint = new THREE.Vector3(
      (this.prevPt.x + point.x) / 2,
      (this.prevPt.y + point.y) / 2,
      (this.prevPt.z + point.z) / 2
    );
    // this.createTempDimensionTag(measure, midPoint);
    if (this.tempDim.length > 1) {
      this.tempDim[0].element.remove();
      this.tempDim.shift();
    }
    this.scene.remove(this.tempLine[0]);
    this.tempLine = [];
    // if tempCache contain more than just the starting point.
    if (this.tempCache.length > 3) {
      this.tempCache.pop();
      this.tempCache.pop();
      this.tempCache.pop();
    }
    if (this.drawing) {
      this.tempCache.push(...point);
      // console.log('temp cache ', this.tempCache);
      const lineGeometry = new LineGeometry().setPositions(this.tempCache);
      // const lineMaterial = new LineMaterial({ color: this.color, linewidth: 0.005 });
      const templine = new Line2(lineGeometry, this.ruler ? LineMaterials.blueLine : LineMaterials.orangeLine);
      templine.renderOrder = 3;
      this.tempLine.push(templine);
      this.scene.add(templine);

      // if (this.knife) {
      //   this.addKnifeCutPlane();
      // }
    }
  };

  addKnifeCutPlane = () => {
    const shapePoints = [];
    // const bottomPositions = [];
    // const topPositions = [];
    // const positions = [];
    for (let i = 0; i < this.tempCache.length; i += 3) {
      const x = this.tempCache[i];
      const y = this.tempCache[i + 1];
      const z = this.tempCache[i + 2];
      // const p = new Vector3(x, y, z);
      // bottomPositions.push(p);
      // const cloned = p.clone();
      // cloned.y += 50;
      // topPositions.push(cloned);

      const v2 = new Vector2(x, z);
      shapePoints.push(v2);
    }

    const shape = new Shape(shapePoints);

    // for (let i = 0; i < topPositions.length; i += 2) {
    //   positions.push(bottomPositions[i].clone());
    //   positions.push(bottomPositions[i + 1].clone());
    //   positions.push(topPositions[i].clone());

    //   positions.push(bottomPositions[i + 1].clone());
    //   positions.push(topPositions[i].clone());
    //   positions.push(topPositions[i + 1].clone());
    // }

    if (this.planeMesh) {
      this.scene.remove(this.planeMesh);
      this.planeMesh.geometry.dispose();
      this.planeMesh.material.dispose();
    }

    const extrudeSettings = {
      depth: 8,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const positions = geometry.getAttribute('position');
    const vertexCount = positions.count;

    for (let i = 0; i < vertexCount; i++) {
      const y = positions.getY(i);
      const z = positions.getZ(i);

      positions.setY(i, z);
      positions.setZ(i, y);
    }

    // const geometry = new THREE.BufferGeometry();
    // geometry.setFromPoints(positions);
    const material = new THREE.MeshBasicMaterial({ color: 0xfa9c3f });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.planeMesh = mesh;
  };

  getControlPoints = (line) => {
    const controlPointsArr = [];
    for (let i = 0; i < this.tempCache.length; i += 3) {
      const position = new THREE.Vector3(this.tempCache[i], this.tempCache[i + 1], this.tempCache[i + 2]);
      const geometry = new THREE.SphereGeometry(1);
      const bigSphereGeometry = new THREE.SphereGeometry(1.5);
      const sphere = new THREE.Mesh(geometry, LineMaterials.whiteMesh);
      const bigSphere = new THREE.Mesh(bigSphereGeometry, LineMaterials.borderMaterial);
      sphere.renderOrder = 1;

      bigSphere.visible = false;
      bigSphere.position.copy(position);
      bigSphere.lineID = line.uuid;
      bigSphere.add(sphere);
      this.scene.add(bigSphere);
      controlPointsArr.push(bigSphere);
    }
    controlPointsArr.forEach((cp) => {
      this.controlPointMeshes.push(cp);
    });
    line.controlPoints = controlPointsArr;
    return controlPointsArr;
  };
  updateLine = (lineToUpdate) => {
    // draw new line
    const positions = [];
    lineToUpdate.controlPoints.forEach((cp) => {
      positions.push(cp.position.x, cp.position.y, cp.position.z);
    });
    lineToUpdate.geometry.setPositions(positions);
  };

  draggingControlPoints = () => {
    this.snapper.snapPoly(null, null, this.editor.viewport.transformControl.attached.position.clone());
    const { snapPt, intersectPt } = this.editor.pencil.snapper;
    this.editor.viewport.transformControl.attached.position.copy(snapPt || intersectPt);
    this.updateLine(this.editor.pencil.lineToUpdate);
  };
  createDimensionTag = (distance, position) => {
    // if (distance === 0) {
    //   return;
    // }
    // //WIP
    // const dimObject = {
    //   position,
    //   measure: Math.round(distance, 2) + ' m',
    // };
    // this.dims.push(dimObject);
    // console.log(this.dims);
    //
    // const newDim = document.createElement('div');
    // newDim.classList.add('dim');
    // //   newDim.classList.add("dim-" + dims.length);
    //
    // const textDiv = document.createElement('div');
    // textDiv.classList.add('text');
    // const text = document.createTextNode(dimObject.measure);
    // textDiv.appendChild(text);
    // const element = document.getElementById('polyline');
    // newDim.appendChild(textDiv);
    // element.appendChild(newDim);
    // dimObject.element = newDim;
    // console.log('NEW DIM ', newDim);
    //
    // //   newDim.classList.add('visible');
    //
    // if (distance === 0) {
    //   console.log('distance 0');
    //   return;
    // }
  };

  createTempDimensionTag = (distance, position) => {
    console.log('TEMP DIM', this.tempDim);
    // if (distance === 0) {
    //   return;
    // }
    // //WIP
    // const dimObject = {
    //   position,
    //   measure: Math.round(distance, 2) + ' m',
    // };
    // this.tempDim.push(dimObject);
    // console.log(this.dims);

    // const newDim = document.createElement('div');
    // newDim.classList.add('dim');
    // //   newDim.classList.add("dim-" + dims.length);

    // const textDiv = document.createElement('div');
    // textDiv.classList.add('text');
    // const text = document.createTextNode(dimObject.measure);
    // textDiv.appendChild(text);
    // const element = document.getElementById('polyline');
    // newDim.appendChild(textDiv);
    // element.appendChild(newDim);
    // dimObject.element = newDim;
    // console.log('NEW DIM ', newDim);

    // //   newDim.classList.add('visible');

    // if (distance === 0) {
    //   console.log('distance 0');
    //   return;
    // }
  };

  updatePolyOffsetPosition() {
    for (let j = 0; j < this.offset.length; j++) {
      const screenPosition = this.offset[j].position.clone();
      screenPosition.project(this.camera);
      this.offset[j].setOffsetPosition(screenPosition);
    }
  }

  updateRulerDimsPosition() {
    for (let j = 0; j < this.dims.length; j++) {
      const screenPosition = this.dims[j].position.clone();
      screenPosition.project(this.camera);
      this.dims[j].setDimPosition(screenPosition);
    }
  }

  updateLineOffset = (width, index) => {
    this.axis[index].width = width;
    this.editor.recordStateForPencil();
    this.editor.state.drawnElements.axis = { ...this.editor.state.drawnElements.axis, ...this.axis };
    this.editor.divideSites();
    this.editor.updateLastUndoItem();
  };

  restore = (key, points, width) => {
    let position = [];

    for (let i = 0; i < points.length; i++) {
      position.push(points[i].x);
      position.push(points[i].y);
      position.push(points[i].z);
    }

    this.tempCache = position;

    let middle = new THREE.Vector3();

    if (points.length % 2 === 0) {
      const point1 = points[points.length / 2 - 1];
      const point2 = points[points.length / 2];
      middle.x = (point1.x + point2.x) / 2;
      middle.y = (point1.y + point2.y) / 2;
      middle.z = (point1.z + point2.z) / 2;
    } else {
      const point1 = points[Math.floor(points.length / 2) - 1];
      const point2 = points[Math.ceil(points.length / 2) - 1];

      middle.x = (point1.x + point2.x) / 2;
      middle.y = (point1.y + point2.y) / 2;
      middle.z = (point1.z + point2.z) / 2;
    }

    const lineGeometry = new LineGeometry().setPositions(position);
    const line = new Line2(lineGeometry, LineMaterials.orangeLine);
    line.renderOrder = 1;
    line.userData.line = true;

    line.uuid = key;
    this.getControlPoints(line);
    this.offset.push(new Offset(key, middle, 'poly-dims', this.updateLineOffset, width));
    this.lines.push(line);
    this.scene.add(line);
    this.tempCache = [];
    this.toggleOffsets(false);
  };

  clearIncomplete = () => {
    // clear incomplete ruler dims

    for (let i = 0; i < this.dims.length; i++) {
      if (this.dims[i].index === this.rulerGroupId) {
        this.dims[i].clear();
      }
    }
    this.dims = this.dims.filter((f) => f.index !== this.rulerGroupId);

    if (this.tempLine[0]) {
      this.scene.remove(this.tempLine[0]);
      this.tempLine[0].geometry.dispose();
      this.tempLine[0].material.dispose();
    }
    if (this.planeMesh) {
      this.scene.remove(this.planeMesh);
      this.planeMesh.geometry.dispose();
      this.planeMesh.material.dispose();
    }

    this.tempCache = [];

    this.prevPt = null;
    this.lastPt = null;
    this.editor.viewport.controls.polyLineTranslateMode = false;
    // this.editor.viewport.transformControl.detach();
    this.toggleOffsets(true);
  };

  toggleOffsets = (show) => {
    if (show) {
      for (let i = 0; i < this.offset.length; i++) {
        // console.log('show', this.offset[i]);
        this.offset[i].show();
      }
    } else {
      for (let i = 0; i < this.offset.length; i++) {
        // console.log('hide', this.offset[i]);
        this.offset[i].hide();
      }
    }
  };

  updateControlPointSizes() {
    if (this.selectedLine) {
      this.editor.pencil.activePoints.forEach((cp) => {
        const distance = this.camera.position.distanceTo(cp.position);
        cp.scale.set(distance / 90, distance / 90, distance / 90);
      });
    }
  }

  updateSnapPointSizes() {
    if (this.snapper.pointHighlight.visible) {
      const distance = this.camera.position.distanceTo(this.snapper.pointHighlight.position);
      this.snapper.pointHighlight.scale.set(distance / 150, distance / 150, distance / 150);
    }

    if (this.snapper.midPointHighlight.visible) {
      const distance = this.camera.position.distanceTo(this.snapper.midPointHighlight.position);
      this.snapper.midPointHighlight.scale.set(distance / 150, distance / 150, distance / 150);
    }

    if (this.snapper.perpHighlight.visible) {
      const distance = this.camera.position.distanceTo(this.snapper.perpHighlight.position);
      this.snapper.perpHighlight.scale.set(distance / 150, distance / 150, distance / 150);
    }
  }

  undo = () => {
    if (this.undoQueue.length > 0) {
      const curItem = this.recordLastState(false);
      this.redoQueue.push(curItem);
      const item = this.undoQueue.pop();
      this.tempDim = cloneDeep(item.tempDim);
      this.tempCache = cloneDeep(item.tempCache);
      if (this.undoQueue.length === 0) {
        this.clearIncomplete();
        return;
      }
      this.temporaryDraw(this.snapper.intersectPt, this.snapper.snapPt);
    } else {
      alert('You have reached the undo limit');
    }
  };

  redo = () => {
    if (this.redoQueue.length > 0) {
      const curItem = this.recordLastState(false);
      this.undoQueue.push(curItem);
      const item = this.redoQueue.pop();
      this.tempDim = cloneDeep(item.tempDim);
      this.tempCache = cloneDeep(item.tempCache);
      this.temporaryDraw(this.snapper.intersectPt, this.snapper.snapPt);
    } else {
      alert('You have reached the redo limit');
    }
  };

  recordLastState = (clearRedo = true) => {
    if (clearRedo) {
      this.redoQueue = [];
    }

    const tempDim = cloneDeep(this.tempDim);
    const tempCache = cloneDeep(this.tempCache);
    const curItem = { tempDim, tempCache };
    return curItem;
  };
}

export default PolyLine;
