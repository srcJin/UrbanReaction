/* 
author: Lakshan Pinto
date: 2022-02-15
*/

// Jin modified sketch based on Lakshan's example

import * as THREE from 'three';
import { basicLineMaterials } from './pencil/materials/public-materials';

class Sketch {
  MOUSE_MOVE_UPDATE_INTERVAL = 2;

  constructor({ editor, viewport }) {
    this.editor = editor;
    this.viewport = viewport;

    this.raycaster = new THREE.Raycaster();
    this.raycastPlane = new THREE.Plane(new THREE.Vector3(0, 100, 0), 0);

    this.domElement = viewport.renderer.domElement;

    this.tempPointArr = [];
    this.tempCount = 0;
    // current polygonline
    this.polygonLine = null;
    // temp polygonline for mouse movement
    this.tempPolygonLine = null;

    // current freehandline
    this.freeHandLine = null;

    // this.drawSavedSketchData();
  }

  raycast = () => {
    this.raycaster.setFromCamera(this.viewport.mouse, this.viewport.current.camera);
    return this.raycaster.ray.intersectPlane(this.raycastPlane, new THREE.Vector3());
  };

  resetTempValues() {
    this.tempPointArr = [];
    this.tempCount = 0;
    this.polygonLine = null;
    this.tempPolygonLine = null;
    this.freeHandLine = null;
  }

  // drawSavedSketchData = () => {
  //   this.editor.state.sketchDataArray.forEach((element) => {
  //     const geometry = new THREE.BufferGeometry().setFromPoints(element.points);
  //     const polygonLine = new THREE.Line(geometry, basicLineMaterials.black04);
  //     polygonLine.uuid = element.uuid;
  //     polygonLine.name = 'sketch';
  //     this.viewport.scene.add(polygonLine);
  //   });
  // };

  // togglePolygon = () => {
  //   const isDrawing = this.editor.toggleIsDrawing();
  //   if (isDrawing) {
  //     this.resetTempValues();
  //     this.viewport.setOrbit(false);

  //     this.domElement.addEventListener('mouseup', this.startPolygon, false);
  //     this.domElement.addEventListener('touchend', this.startPolygon, false);

  //     this.domElement.addEventListener('dblclick', this.stopPolygon, false);
  //   } else {
  //     this.resetTempValues();
  //     this.viewport.setOrbit(true);

  //     this.domElement.removeEventListener('mouseup', this.startPolygon, false);
  //     this.domElement.removeEventListener('touchend', this.startPolygon, false);

  //     this.domElement.removeEventListener('dblclick', this.stopPolygon, false);

  //     this.domElement.removeEventListener('mousemove', this.updatePolygon, false);
  //     this.domElement.removeEventListener('touchmove', this.updatePolygon, false);
  //   }
  // };

  // startPolygon = () => {
  //   const pos = this.raycast();
  //   this.tempPointArr.push(pos);
  //   if (this.tempPointArr.length === 1) {
  //     this.domElement.addEventListener('mousemove', this.updatePolygon, false);
  //     this.domElement.addEventListener('touchmove', this.updatePolygon, false);
  //   }
  //   this.drawPolygon();
  // };

  // stopPolygon = () => {
  //   this.domElement.removeEventListener('mousemove', this.updatePolygon, false);
  //   this.domElement.removeEventListener('touchmove', this.updatePolygon, false);
  //   this.tempPointArr.pop();

  //   // remove existing tempPolygonLine
  //   if (this.tempPolygonLine) {
  //     this.viewport.scene.remove(this.tempPolygonLine);
  //     this.tempPolygonLine.geometry.dispose();
  //     this.tempPolygonLine.material.dispose();
  //     this.tempPolygonLine = null;
  //   }

  //   // remove existing polygonLine
  //   if (this.polygonLine) {
  //     this.viewport.scene.remove(this.polygonLine);
  //     this.polygonLine.geometry.dispose();
  //     this.polygonLine.material.dispose();
  //     this.polygonLine = null;
  //   }

  //   const geometry = new THREE.BufferGeometry().setFromPoints(this.tempPointArr);
  //   const polygonLine = new THREE.Line(geometry, basicLineMaterials.black04);
  //   polygonLine.name = 'sketch';
  //   this.viewport.scene.add(polygonLine);

  //   this.editor.addSketchData({ uuid: polygonLine.uuid, type: 'polygon', points: this.tempPointArr });

  //   this.resetTempValues();
  // };

  // updatePolygon = () => {
  //   if (this.tempCount === this.MOUSE_MOVE_UPDATE_INTERVAL) {
  //     this.tempCount = 0;
  //     if (this.tempPolygonLine) {
  //       this.viewport.scene.remove(this.tempPolygonLine);
  //       this.tempPolygonLine.geometry.dispose();
  //       this.tempPolygonLine.material.dispose();
  //       this.tempPolygonLine = null;
  //     }

  //     const tempPointArrLastPos = this.tempPointArr[this.tempPointArr.length - 1];
  //     const mousePos = this.raycast();

  //     const tempLinePoints = [tempPointArrLastPos, mousePos];

  //     const geometry = new THREE.BufferGeometry().setFromPoints(tempLinePoints);
  //     const tempPolygonLine = new THREE.Line(geometry, basicLineMaterials.red04);
  //     this.tempPolygonLine = tempPolygonLine;
  //     this.viewport.scene.add(tempPolygonLine);
  //   }
  //   this.tempCount++;
  // };

  // drawPolygon = () => {
  //   if (this.polygonLine) {
  //     this.viewport.scene.remove(this.polygonLine);
  //     this.polygonLine.geometry.dispose();
  //     this.polygonLine.material.dispose();
  //     this.polygonLine = null;
  //   }

  //   const geometry = new THREE.BufferGeometry().setFromPoints(this.tempPointArr);
  //   const polygonLine = new THREE.Line(geometry, basicLineMaterials.black04);
  //   this.polygonLine = polygonLine;
  //   this.viewport.scene.add(polygonLine);
  // };

  toggleFreehand = () => {
    const isDrawing = this.editor.toggleIsDrawing();
    if (isDrawing) {
      this.resetTempValues();
      this.viewport.setOrbit(false);

      this.domElement.addEventListener('mousedown', this.startFreehand, false);
      this.domElement.addEventListener('touchstart', this.startFreehand, false);

      this.domElement.addEventListener('mouseup', this.stopFreehand, false);
      this.domElement.addEventListener('touchend', this.stopFreehand, false);
    } else {
      this.resetTempValues();
      this.viewport.setOrbit(true);

      this.domElement.removeEventListener('mousedown', this.startFreehand, false);
      this.domElement.removeEventListener('touchstart', this.startFreehand, false);

      this.domElement.removeEventListener('mouseup', this.stopFreehand, false);
      this.domElement.removeEventListener('touchend', this.stopFreehand, false);
    }
  };

  startFreehand = () => {
    this.domElement.addEventListener('mousemove', this.updateFreehand, false);
    this.domElement.addEventListener('touchmove', this.updateFreehand, false);
    const pos = this.raycast();
    this.tempPointArr.push(pos);
  };

  updateFreehand = () => {
    if (this.tempCount === this.MOUSE_MOVE_UPDATE_INTERVAL) {
      this.tempCount = 0;
      if (this.freeHandLine) {
        this.viewport.scene.remove(this.freeHandLine);
        this.freeHandLine.geometry.dispose();
        this.freeHandLine.material.dispose();
        this.freeHandLine = null;
      }

      const pos = this.raycast();
      this.tempPointArr.push(pos);

      const geometry = new THREE.BufferGeometry().setFromPoints(this.tempPointArr);
      const freeHandLine = new THREE.Line(geometry, basicLineMaterials.black04);
      this.freeHandLine = freeHandLine;
      this.viewport.scene.add(freeHandLine);
    }
    this.tempCount++;
  };

  stopFreehand = () => {
    this.domElement.removeEventListener('mousemove', this.updateFreehand, false);
    this.domElement.removeEventListener('touchmove', this.updateFreehand, false);

    // remove existing freeHandLine
    if (this.freeHandLine) {
      this.viewport.scene.remove(this.freeHandLine);
      this.freeHandLine.geometry.dispose();
      this.freeHandLine.material.dispose();
      this.freeHandLine = null;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(this.tempPointArr);
    const freeHandLine = new THREE.Line(geometry, basicLineMaterials.black04);
    freeHandLine.name = 'sketch';
    this.viewport.scene.add(freeHandLine);

    this.editor.addSketchData({ uuid: freeHandLine.uuid, type: 'freehand', points: this.tempPointArr });

    this.resetTempValues();
  };

  toggleEraser = () => {
    const isDrawing = this.editor.toggleIsDrawing();
    if (isDrawing) {
      this.resetTempValues();
      this.viewport.setOrbit(false);

      this.domElement.addEventListener('mouseup', this.startEraser, false);
      this.domElement.addEventListener('touchend', this.startEraser, false);
    } else {
      this.resetTempValues();
      this.viewport.setOrbit(true);

      this.domElement.removeEventListener('mouseup', this.startEraser, false);
      this.domElement.removeEventListener('touchend', this.startEraser, false);
    }
  };

  startEraser = () => {
    this.raycaster.setFromCamera(this.viewport.mouse, this.viewport.current.camera);
    const intersects = this.raycaster.intersectObjects(this.viewport.scene.children, true);

    if (intersects.length > 0) {
      for (let i = 0; i < intersects.length; i += 1) {
        const element = intersects[i];
        if (element.object.name === 'sketch') {
          const object = this.viewport.scene.getObjectByProperty('uuid', element.object.uuid);
          this.viewport.scene.remove(object);
          object.geometry.dispose();
          object.material.dispose();
        }
      }
    }
  };
}

export default Sketch;
