import { Polybezier } from './polyBezier';
import * as THREE from 'three';
import Offset from './dimensions/offset';
import LineMaterials from './materials/line-materials';

export class Freehand {
  constructor(camera, renderer, scene, materials, editor) {
    this.renderer = renderer;
    this.enabled = false;
    this.drawing = false;
    this.enableDraw = true;
    this.collection = [];
    this.mouse = { x: null, y: null };
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.materials = materials;
    this.offset = [];
    this.drawingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.cache = {
      points: [],
      mesh: null,
      mat: new THREE.LineBasicMaterial({ color: 0x000000 }),
    };
    this.controlPoints = [];
    // this.controlGuides = new THREE.Object3D();
    if (this.controlPoints.length > 0) {
      this.scene.add(this.controlPoints);
    }

    // this.scene.add(this.controlGuides);
    this.axis = {};
    this.editor = editor;
  }
  raycast = (event) => {
    const { domElement } = this.renderer;
    const posX = event.clientX;
    const posY = event.clientY;

    if (!posX || !posY) {
      return null;
    }

    this.mouse.x = ((posX - domElement.offsetLeft) / window.innerWidth) * 2 - 1;
    this.mouse.y = -((posY - domElement.offsetTop) / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.ray.intersectPlane(this.drawingPlane, new THREE.Vector3());
  };
  start = (event) => {
    if (event.button != 0) {
      return;
    }
    // event.button
    if (!this.enableDraw) {
      return;
    }
    this.drawing = true;
    const { domElement } = this.renderer;
    domElement.addEventListener('mousemove', this.draw, false);
    domElement.addEventListener('touchmove', this.draw, false);
  };
  draw = (event) => {
    if (!this.enableDraw) {
      return;
    }
    const pos = this.raycast(event);
    this.cache.points.push(pos);
    this.drawGuide(this.cache.points);
  };
  drawGuide = (points) => {
    if (!this.enableDraw) {
      return;
    }
    if (this.cache.mesh) {
      this.scene.remove(this.cache.mesh);
      this.cache.mesh.geometry.dispose();
      this.cache.mesh.material.dispose();
      this.cache.mesh = null;
    }

    if (!points) {
      return;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(this.cache.points);
    this.cache.mesh = new THREE.Line(geometry, this.cache.mat);
    this.cache.mesh.renderOrder = 3;
    this.scene.add(this.cache.mesh);
  };

  cancel = () => {
    this.drawing = false;
    const { domElement } = this.renderer;
    domElement.removeEventListener('mousemove', this.draw, false);
    domElement.removeEventListener('touchmove', this.draw, false);

    if (this.cache.mesh) {
      this.scene.remove(this.cache.mesh);
      this.cache.mesh.geometry.dispose();
      this.cache.mesh.material.dispose();
      this.cache.mesh = null;
      this.cache.points = [];
    }
  };

  stop = () => {
    if (!this.enableDraw) {
      return;
    }
    this.drawing = false;
    const { domElement } = this.renderer;
    domElement.removeEventListener('mousemove', this.draw, false);
    domElement.removeEventListener('touchmove', this.draw, false);

    const polyline = [...this.cache.points];
    this.cache.points = [];
    this.drawGuide();

    const bez = this.toBezier(polyline);
    this.collection.push(bez);
    bez.build(100, this.materials.orangeLine);
    console.log('Freehand collection:: ', this.collection);
    bez.mesh.userData.line = true;
    this.scene.add(bez.mesh);
    // this.controlPoints.add(...bez.controlPointMeshes);
    // this.controlGuides.add(...bez.controlGuideLines);
    bez.controlPointMeshes.forEach((cp) => {
      this.scene.add(cp);
      this.controlPoints.push(cp);
    });
    bez.controlGuideLines.forEach((line) => {
      this.scene.add(line);
    });

    const points = bez.getPolylineFromBezier(100);

    const middleBez = bez.evaluate(0.5);
    let middle = new THREE.Vector3();
    middle.x = middleBez.x;
    middle.y = middleBez.y;
    middle.z = middleBez.z;

    if (this.offset.length > 0) {
      this.offset[this.offset.length - 1].hide();
    }
    this.offset.push(new Offset(bez.uuid, middle, 'poly-dims', this.updateLineOffset));
    this.editor.recordStateForPencil();
    this.axis = {
      ...this.axis,
      [bez.uuid]: {
        type: 'spline',
        points: points,
        width: this.offset[this.offset.length - 1].width,
      },
    };
    // console.log('Polybez:: ', this.axis);
    this.editor.state.drawnElements.axis = { ...this.editor.state.drawnElements.axis, ...this.axis };
    this.editor.divideSites();
    this.editor.updateLastUndoItem();
  };
  toBezier(polyline) {
    const polybez = new Polybezier(polyline, 10);
    return polybez;
  }

  updateLineOffset = (width, index) => {
    this.axis[index].width = width;
    this.editor.recordStateForPencil();
    this.editor.state.drawnElements.axis = { ...this.editor.state.drawnElements.axis, ...this.axis };
    this.editor.divideSites();
    this.editor.updateLastUndoItem();
  };

  updateFreeHandOffsetPosition() {
    for (let j = 0; j < this.offset.length; j++) {
      const screenPosition = this.offset[j].position.clone();
      screenPosition.project(this.camera);
      this.offset[j].setOffsetPosition(screenPosition);
    }
  }

  draggingControlPoints = () => {
    const transformControl = this.editor.viewport.transformControl;
    //taking current position of transform controls and updating the control point position in recipe
    if (transformControl.children.length) {
      transformControl.attached.recipe.x = transformControl.attached.position.x;
      transformControl.attached.recipe.y = transformControl.attached.position.y;
      transformControl.attached.recipe.z = transformControl.attached.position.z;
      if (transformControl.attached.sister) {
        //update sister
        const anchor = transformControl.attached.anchor;
        const pointToAnchor = new THREE.Vector3(
          anchor.position.x - transformControl.attached.position.x,
          anchor.position.y - transformControl.attached.position.y,
          anchor.position.z - transformControl.attached.position.z
        );

        pointToAnchor.normalize();
        const anchorToSisterDistance = anchor.position.distanceTo(transformControl.attached.sister.position);
        const anchorToSisterVector = pointToAnchor.clone().multiplyScalar(anchorToSisterDistance);
        const newSisterPosition = new THREE.Vector3(
          anchor.position.x + anchorToSisterVector.x,
          anchor.position.y + anchorToSisterVector.y,
          anchor.position.z + anchorToSisterVector.z
        );
        //update sister point to construct the bezier
        transformControl.attached.sister.recipe.x = newSisterPosition.x;
        transformControl.attached.sister.recipe.y = newSisterPosition.y;
        transformControl.attached.sister.recipe.z = newSisterPosition.z;
        //update mesh position of sister
        transformControl.attached.sister.position.x = newSisterPosition.x;
        transformControl.attached.sister.position.y = newSisterPosition.y;
        transformControl.attached.sister.position.z = newSisterPosition.z;
      }

      if (transformControl.attached.recipe.reference.sibling) {
        //selected control point is on the line
        transformControl.attached.recipe.reference.sibling.x = transformControl.attached.position.x;
        transformControl.attached.recipe.reference.sibling.y = transformControl.attached.position.y;
        transformControl.attached.recipe.reference.sibling.z = transformControl.attached.position.z;
      }
      if (transformControl.attached.dependents.length > 0) {
        //update dependents
        const deltaVector = new THREE.Vector3(
          transformControl.attached.position.x - transformControl.attached.prevPosition.x,
          transformControl.attached.position.y - transformControl.attached.prevPosition.y,
          transformControl.attached.position.z - transformControl.attached.prevPosition.z
        );

        transformControl.attached.dependents.forEach((dependent) => {
          dependent.recipe.x += deltaVector.x;
          dependent.recipe.y += deltaVector.y;
          dependent.recipe.z += deltaVector.z;

          dependent.position.add(deltaVector);
        });
        transformControl.attached.prevPosition = transformControl.attached.position.clone();
      }
      //finds polybezier recipe on freehand collection, removes current mesh from scene, rebuilds and adds back
      const polybezier = this.collection.find(
        (pb) => pb.uuid === transformControl.attached.recipe.reference.polybezierID
      );
      this.scene.remove(polybezier.mesh);
      polybezier.mesh.geometry.dispose();
      polybezier.mesh.material.dispose();
      polybezier.build(100, LineMaterials.orangeLine);
      this.scene.add(polybezier.mesh);
      polybezier.controlGuideLines.forEach((line) => {
        this.scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });
      polybezier.updateControlGuideLines();
      polybezier.controlGuideLines.forEach((line) => {
        console.log('LINE ', line);
        this.scene.add(line);
        // this.scene.add(line);
      });
      this.prevControlPosition = transformControl.attached.position.clone();
    }
  };

  // updateGuideLines = (Remove, toAdd) => {

  // }

  restore = (uuid, points, width) => {
    const bez = this.toBezier(points);

    this.collection.push(bez);
    bez.build(100, this.materials.orangeLine);

    bez.mesh.userData.line = true;

    bez.uuid = uuid;
    this.scene.add(bez.mesh);

    bez.controlPointMeshes.forEach((cp) => {
      this.scene.add(cp);
      this.controlPoints.push(cp);
    });
    bez.controlGuideLines.forEach((line) => {
      this.scene.add(line);
    });

    const middleBez = bez.evaluate(0.5);
    let middle = new THREE.Vector3();
    middle.x = middleBez.x;
    middle.y = middleBez.y;
    middle.z = middleBez.z;

    this.offset.push(new Offset(uuid, middle, 'poly-dims', this.updateLineOffset, width));
    this.toggleOffsets(false);
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
}
