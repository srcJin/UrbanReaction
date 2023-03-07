import Snap from './snap/snap';
import { Freehand } from './freehand';
import * as THREE from 'three';
import PolyLine from './polyLine';
import LineMaterials from './materials/line-materials';
import { Select } from './selection/select';
import { v4 as uuidv4 } from 'uuid';
class Pencil {
  constructor(editor) {
    this.editor = editor;
    this.camera = editor.viewport.current.camera;
    this.transformControl = editor.viewport.transformControl;
    this.controls = editor.viewport.orbit;
    this.scene = editor.viewport.scene;
    this.renderer = editor.viewport.renderer;
    this.snapper = new Snap(editor);
    this.freehand = new Freehand(this.camera, this.renderer, this.scene, LineMaterials, editor);
    this.editSnapper = new Snap(editor);
    this.selectedControlPoint = null;
    this.lineToUpdate = null;
    this.polyLine = new PolyLine(
      editor.viewport.mouse,
      this.camera,
      this.scene,
      this.snapper.snapPt,
      this.snapper.pickingArr,
      editor.viewport.raycaster,
      this.snapper,
      this.editSnapper,
      editor
    );
    this.selectedLineUuid = null;
    this.selectedPb = null;
    this.activePoints = [];
    this.selectedOffsetPoly = null;
    this.selectedOffsetFreeHand = null;
    this.selectedLines = [];
  }

  handleDraggingChanged = async (event) => {
    if (this.editor.viewport.controls.freehand) {
      this.freehand.enableDraw = !this.freehand.enableDraw;
    } else if (this.editor.viewport.controls.polyLineTranslateMode === true) {
      //update cache
      // insert plots into cache
      this.snapper.cache = { points: [], edges: [] };
      this.editor.handleSnap();
      //update cache with new lines
      if (this.polyLine.lines.length > 0) {
        this.polyLine.lines.forEach((line) => {
          const positions = [];
          var prevPt;
          for (let i = 0; i < line.controlPoints.length; i++) {
            const point = line.controlPoints[i].position.clone();
            positions.push(point);
            if (prevPt) {
              this.snapper.addEdgesToCache([prevPt, point]);
            }
            prevPt = point;
            this.snapper.addPointsToCache([point]);
          }
        });
      }

      // POLYBEZIER
      if (this.selectedPb) {
        // updating plot
        const points = this.selectedPb.getPolylineFromBezier(100);
        this.editor.recordStateForPencil();
        this.editor.state.drawnElements.axis[this.selectedPb.uuid].points = points;
        await this.editor.divideSites();
        this.editor.updateLastUndoItem();

        // updating dimension tag position
        const middleBez = this.selectedPb.evaluate(0.5);
        let middle = new THREE.Vector3();
        middle.x = middleBez.x;
        middle.y = middleBez.y;
        middle.z = middleBez.z;

        const offset = this.freehand.offset.find((os) => os.index === this.selectedPb.uuid);
        offset.position = middle;

        return;
      }
      // POLYLINE
      const points = [];
      // update plot
      const selectedPoint = this.editor.viewport.transformControl.attached.uuid;

      this.lineToUpdate.controlPoints.forEach((cp) => {
        if (cp.uuid === selectedPoint && this.snapper.snapPt) {
          points.push(this.snapper.snapPt);
          const { x, y, z } = this.snapper.snapPt;
          cp.position.set(x, y, z);
        } else {
          points.push(cp.position);
        }
      });

      //clear edge Lines
      if (this.snapper.tempEdgeHighlight.length > 0) {
        this.snapper.tempEdgeHighlight.forEach((edge) => {
          this.scene.remove(edge);
          edge.geometry.dispose();
          edge.material.dispose();
        });
      }

      if (this.editor.state.drawnElements.axis && this.editor.state.drawnElements.axis[this.lineToUpdate.uuid]) {
        this.editor.recordStateForPencil();
        this.editor.state.drawnElements.axis[this.lineToUpdate.uuid].points = points;
        await this.editor.divideSites();
        this.editor.updateLastUndoItem();
      }

      // update dimension tag position
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

      if (this.lineToUpdate.userData.type) {
        const dimension = this.polyLine.dims.find((os) => os.index === this.lineToUpdate.uuid);
        dimension.position = middle;
      } else {
        const offset = this.polyLine.offset.find((os) => os.index === this.lineToUpdate.uuid);
        offset.position = middle;
      }
    }
  };

  onMouseMovePencil = (event) => {
    let objects = this.freehand.controlPoints;
    if (!objects.length) return;
    const camera = this.editor.viewport.current.camera;
    const { raycaster, mouse } = this.editor.viewport;
    let { intersects, INTERSECTED } = Select({
      raycaster,
      mouse,
      camera,
      objects,
    });

    //find control point on hover::
    if (this.selectedControlPoint !== null) {
      // this.selectedControlPoint.material.emissive.setHex(0x000000);
      this.selectedControlPoint = null;
    }
    if (!INTERSECTED) {
      return;
    }
    this.selectedControlPoint = INTERSECTED;
    // this.selectedControlPoint.material.emissive.setHex(0xff0000);
    return;
  };

  onMouseDownPencil = (event) => {
    if (this.selectedControlPoint) {
      console.log('the point!!!', this.selectedControlPoint);
      if (this.selectedControlPoint.parent !== this.scene) {
        this.editor.viewport.transformControl.attach(this.selectedControlPoint.parent);
        // this.editor.viewport.transformControl.attached = this.selectedControlPoint.parent;
      } else {
        this.editor.viewport.transformControl.attach(this.selectedControlPoint);
        // this.editor.viewport.transformControl.attached = this.selectedControlPoint;
      }
      //   console.log("After CP attach:: ", transformControl.attached);
    } else {
      if (!this.editor.viewport.transformControl.dragging) {
        this.editor.viewport.transformControl.detach();
        // this.editor.viewport.transformControl.attached = null;
      }
    }
    return;
  };

  addEventListenersPencil = () => {
    this.editor.viewport.controls.clearEventListeners();
    this.editor.viewport.renderer.domElement.removeEventListener(
      'mousemove',
      this.editor.viewport.mouseHover.bind(this.editor.viewport)
    );

    const dom = this.editor.viewport.renderer.domElement;
    dom.addEventListener('pointerdown', this.onMouseDownPencil);
    dom.addEventListener('pointermove', this.onMouseMovePencil);
  };

  removeEventListenersPencil = () => {
    this.editor.viewport.renderer.domElement.addEventListener(
      'mousemove',
      this.editor.viewport.mouseHover.bind(this.editor.viewport)
    );
    this.editor.viewport.controls.addEventListeners();
    const dom = this.editor.viewport.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onMouseDownPencil);
    dom.removeEventListener('pointermove', this.onMouseMovePencil);
  };

  togglePencil = (active) => {
    this.freehand.enabled = active;
    this.editor.viewport.controls.freeHandMode = this.freehand.enabled;
    const { domElement } = this.renderer;
    const cur = document.getElementById('mount');
    if (this.freehand.enabled) {
      this.freehand.collection.forEach((bez) => {
        bez.mesh.material.dispose();
        bez.mesh.material = LineMaterials.orangeLine;
      });
      this.controls.enabled = false;
      this.freehand.toggleOffsets(false);
      cur.style.cursor = "url('/images/icons/pen.svg') -50 48, default";
      this.addEventListenersPencil();
      domElement.addEventListener('pointerdown', this.freehand.start, false);
      domElement.addEventListener('pointerup', this.freehand.stop, false);
      this.transformControl.addEventListener('dragging-changed', this.handleDraggingChanged);
    } else {
      this.snapper.clearGuides();
      this.controls.enabled = true;
      cur.style.cursor = 'default';
      this.freehand.toggleOffsets(false);
      this.removeEventListenersPencil();
      domElement.removeEventListener('pointerdown', this.freehand.start, false);
      domElement.removeEventListener('pointerup', this.freehand.stop, false);
      this.transformControl.removeEventListener('dragging-changed', this.handleDraggingChanged);
    }
  };

  clearFreehandOnEscape = () => {
    this.togglePencil(false);
    this.freehand.cancel();
  };

  onMouseMovePolyLine = (event) => {
    let objects = this.polyLine.ruler
      ? this.editor.game.foamBlocks.atlas.all
      : Object.values(this.editor.game.foamBlocks.atlas.plots);

    const camera = this.editor.viewport.current.camera;
    const { raycaster, mouse } = this.editor.viewport;
    // if (!objects.length) return;
    let { intersects, INTERSECTED, intersections } = Select({
      raycaster,
      mouse,
      camera,
      objects,
    });

    if (!event.shiftKey) {
      this.snapper.snapPoly(this.polyLine.lastPt, intersections);
    } else {
      this.snapper.getPerpendicular(this.polyLine.lastPt);
    }
    if (this.polyLine.drawing === true) {
      this.polyLine.temporaryDraw(this.snapper.intersectPt, this.snapper.snapPt);
    }
    return;
  };

  // onMouseDownPolyLine = (event) => {};

  addEventListenersPolyLine = () => {
    this.editor.viewport.controls.clearEventListeners();
    this.editor.viewport.renderer.domElement.removeEventListener(
      'mousemove',
      this.editor.viewport.mouseHover.bind(this.editor.viewport)
    );

    const dom = this.editor.viewport.renderer.domElement;
    // dom.addEventListener('pointerdown', this.onMouseDownPolyLine);
    dom.addEventListener('pointermove', this.onMouseMovePolyLine);
  };

  removeEventListenersPolyLine = () => {
    this.editor.viewport.renderer.domElement.addEventListener(
      'mousemove',
      this.editor.viewport.mouseHover.bind(this.editor.viewport)
    );
    this.editor.viewport.controls.addEventListeners();
    const dom = this.editor.viewport.renderer.domElement;
    // dom.removeEventListener('pointerdown', this.onMouseDownPolyLine);
    dom.removeEventListener('pointermove', this.onMouseMovePolyLine);
  };

  togglePolyLine = (active, ruler, knife) => {
    this.polyLine.drawing = active;
    this.polyLine.ruler = ruler;
    if (ruler) this.polyLine.rulerGroupId = uuidv4();
    this.polyLine.knife = knife;
    this.editor.viewport.controls.polyLineMode = this.polyLine.drawing;
    const { domElement } = this.renderer;
    const cur = document.getElementById('mount');
    if (this.polyLine.drawing) {
      this.polyLine.lines.forEach((line) => {
        line.material.dispose();
        line.material = LineMaterials.orangeLine;
      });

      cur.style.cursor = "url('/images/icons/pen.svg') -50 48, default";
      if (ruler) cur.style.cursor = "url('/images/icons/ruler.svg'), default";
      if (knife) cur.style.cursor = "url('/images/icons/knife.svg') -50 41, default";

      this.addEventListenersPolyLine();
      domElement.addEventListener('dblclick', this.polyLine.end, false);
      this.polyLine.toggleOffsets(false);
      domElement.addEventListener('pointerdown', this.polyLine.start, false);
      this.transformControl.addEventListener('dragging-changed', this.handleDraggingChanged);
    } else {
      this.polyLine.clearIncomplete();
      this.snapper.clearGuides();
      this.polyLine.toggleOffsets(false);
      this.removeEventListenersPolyLine();
      domElement.removeEventListener('dblclick', this.polyLine.end, false);
      domElement.removeEventListener('pointerdown', this.polyLine.start, false);
      this.transformControl.removeEventListener('dragging-changed', this.handleDraggingChanged);
      cur.style.cursor = 'default';
    }
  };

  onMouseMoveEdit = (event) => {
    const camera = this.editor.viewport.current.camera;
    const { raycaster, mouse } = this.editor.viewport;
    let controlPointsArray = this.editor.pencil.activePoints;
    let { intersects, INTERSECTED, intersections } = Select({
      raycaster,
      mouse,
      camera,
      objects: controlPointsArray,
    });

    if (this.selectedControlPoint !== null) {
      // this.selectedControlPoint.material.emissive.setHex(0x000000);
      this.selectedControlPoint = null;
    }
    if (INTERSECTED) {
      this.selectedControlPoint = INTERSECTED;
    }
    return;
  };

  onMouseDownEdit = (event) => {
    if (!this.selectedControlPoint) {
      return;
    }

    if (this.selectedControlPoint.parent !== this.scene) {
      this.editor.viewport.transformControl.attach(this.selectedControlPoint.parent);
      this.editor.viewport.transformControl.attached = this.selectedControlPoint.parent;
      this.editor.viewport.transformControl.attached.prevPosition =
        this.editor.viewport.transformControl.attached.position.clone();
      this.findLine();
      // highlight selected line
      if (this.lineToUpdate) {
        this.lineToUpdate.material.dispose();
        this.lineToUpdate.material = LineMaterials.orangeLine;
      }
    } else if (this.selectedControlPoint.parent === this.scene) {
      this.editor.viewport.transformControl.attach(this.selectedControlPoint);
      this.editor.viewport.transformControl.attached = this.selectedControlPoint;
      this.editor.viewport.transformControl.attached.prevPosition =
        this.editor.viewport.transformControl.attached.position.clone();
      // find corresponding line
      this.findLine();

      // highlight selected line
      if (this.lineToUpdate) {
        this.lineToUpdate.material.dispose();
        this.lineToUpdate.material = LineMaterials.orangeLine;
      }
    }
    //   console.log("After CP attach:: ", transformControl.attached);
    else {
      if (!this.editor.viewport.transformControl.dragging) {
        this.editor.viewport.transformControl.detach();
        // this.editor.viewport.transformControl.attached = null;
      }
    }
    return;
  };

  addEventListenersEdit = () => {
    this.editor.viewport.controls.clearEventListeners();
    this.editor.viewport.renderer.domElement.removeEventListener(
      'mousemove',
      this.editor.viewport.mouseHover.bind(this.editor.viewport)
    );

    const dom = this.editor.viewport.renderer.domElement;
    dom.addEventListener('pointerdown', this.onMouseDownEdit);
    dom.addEventListener('pointermove', this.onMouseMoveEdit);
  };

  removeEventListenersEdit = () => {
    this.editor.viewport.renderer.domElement.addEventListener(
      'mousemove',
      this.editor.viewport.mouseHover.bind(this.editor.viewport)
    );
    this.editor.viewport.controls.addEventListeners();
    const dom = this.editor.viewport.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onMouseDownEdit);
    dom.removeEventListener('pointermove', this.onMouseMoveEdit);
  };

  toggleEdit = () => {
    const selectedLine = this.polyLine.lines.find((line) => line.uuid === this.selectedLineUuid);
    this.polyLine.selectedLine = selectedLine;
    this.editor.viewport.controls.polyLineTranslateMode = !this.editor.viewport.controls.polyLineTranslateMode;

    if (!this.editor.viewport.controls.polyLineTranslateMode) {
      this.removeEventListenersEdit();
      this.editor.viewport.transformControl.removeEventListener('dragging-changed', this.handleDraggingChanged);
      this.editor.viewport.transformControl.detach();

      if (this.selectedPb) {
        this.selectedPb.mesh.material.dispose();
        this.selectedPb.mesh.material = LineMaterials.lineDeselected;
        this.selectedPb.controlPointMeshes.forEach((cp) => {
          cp.visible = false;
        });
        this.selectedPb.controlGuideLines.forEach((cg) => {
          cg.visible = false;
        });
      } else {
        // Hide snap guides
        this.snapper.clearGuides();
        selectedLine.controlPoints.forEach((cp) => {
          cp.visible = false;
        });

        selectedLine.material.dispose();
        selectedLine.material = LineMaterials.lineDeselected;
      }
      // reset
      this.activePoints = [];
      this.selectedLineUuid = null;
      this.selectedPb = null;
    } else if (this.editor.viewport.controls.polyLineTranslateMode) {
      this.addEventListenersEdit();
      this.editor.viewport.transformControl.addEventListener('dragging-changed', this.handleDraggingChanged);
      if (this.selectedPb) {
        this.selectedPb.controlPointMeshes.forEach((cp) => {
          cp.visible = true;
          this.activePoints.push(cp);
        });
        this.selectedPb.controlGuideLines.forEach((cg) => {
          cg.visible = true;
        });
        return;
      }
      // poly
      // create control points on selected line
      this.activePoints = [];
      selectedLine.controlPoints.forEach((cp) => {
        this.activePoints.push(cp);
        cp.visible = true;
      });
    }
  };

  selectLine = (line) => {
    this.selectedLines = [];
    this.selectedPb = null;
    // turn all lines to gray
    this.freehand.collection.forEach((pb) => {
      if (pb.mesh.uuid === line.uuid) {
        this.selectedPb = pb;
        if (this.selectedLines.map((sl) => sl.uuid).indexOf(line.uuid) === -1) {
          this.selectedLines.push({ type: 'pb', line: pb, uuid: line.uuid });
        }
      }
      pb.mesh.material.dispose();
      pb.mesh.material = LineMaterials.lineDeselected;
    });

    if (this.selectedOffsetFreeHand !== null) {
      if (this.freehand.offset[this.selectedOffsetFreeHand]) {
        this.freehand.offset[this.selectedOffsetFreeHand].hide();
      }
    }
    this.selectedOffsetFreeHand = this.freehand.collection.indexOf(this.selectedPb);

    if (this.freehand.offset[this.selectedOffsetFreeHand]) {
      this.freehand.offset[this.selectedOffsetFreeHand].show();
    }

    this.polyLine.lines.forEach((pl) => {
      if (pl.uuid === line.uuid) {
        this.selectedLine = pl;
        if (this.selectedLines.map((sl) => sl.uuid).indexOf(line.uuid) === -1) {
          this.selectedLines.push({ type: 'pl', line: pl, uuid: line.uuid });
        }
      }
      pl.material.dispose();
      pl.material = LineMaterials.lineDeselected;
    });
    console.log('passed line', line);

    if (this.selectedOffsetPoly !== null) {
      if (this.polyLine.offset[this.selectedOffsetPoly]) {
        this.polyLine.offset[this.selectedOffsetPoly].hide();
      }
    }
    this.selectedOffsetPoly = this.polyLine.lines.indexOf(line);

    if (this.polyLine.offset[this.selectedOffsetPoly]) {
      this.polyLine.offset[this.selectedOffsetPoly].show();
    }

    this.selectedLineUuid = `${line.uuid}`;
    line.material.dispose();
    line.material = LineMaterials.orangeLine;
  };

  toggleMultipleLineSelection = (line) => {
    if (this.selectedLines.filter((sl) => sl.uuid === line.uuid).length > 0) {
      this.deselectMultipleLines(line);
      return;
    }
    this.selectMultipleLines(line);
  };

  selectMultipleLines = (line) => {
    this.freehand.collection.forEach((pb) => {
      if (pb.mesh.uuid === line.uuid) {
        if (this.selectedLines.map((sl) => sl.uuid).indexOf(line.uuid) === -1) {
          this.selectedLines.push({ type: 'pb', line: pb, uuid: line.uuid });
        }
      }
    });

    if (this.selectedOffsetFreeHand !== null) {
      if (this.freehand.offset[this.selectedOffsetFreeHand]) {
        this.freehand.offset[this.selectedOffsetFreeHand].hide();
      }
    }
    this.selectedOffsetFreeHand = null;

    this.polyLine.lines.forEach((pl) => {
      if (pl.uuid === line.uuid) {
        if (this.selectedLines.map((sl) => sl.uuid).indexOf(line.uuid) === -1) {
          this.selectedLines.push({ type: 'pl', line: pl, uuid: line.uuid });
        }
      }
    });

    if (this.selectedOffsetPoly !== null) {
      if (this.polyLine.offset[this.selectedOffsetPoly]) {
        this.polyLine.offset[this.selectedOffsetPoly].hide();
      }
    }

    this.selectedOffsetPoly = null;
    this.selectedLineUuid = null;

    line.material.dispose();
    line.material = LineMaterials.orangeLine;
  };

  deselectMultipleLines = (line) => {
    this.freehand.collection.forEach((pb) => {
      if (pb.mesh.uuid === line.uuid) {
        pb.mesh.material.dispose();
        pb.mesh.material = LineMaterials.lineDeselected;
        this.selectedLines = this.selectedLines.filter((sl) => sl.uuid !== line.uuid);
      }
    });

    this.polyLine.lines.forEach((pl) => {
      if (pl.uuid === line.uuid) {
        pl.material.dispose();
        pl.material = LineMaterials.lineDeselected;
        this.selectedLines = this.selectedLines.filter((sl) => sl.uuid !== line.uuid);
      }
    });

    if (this.selectedLines.length === 1) {
      const selected = this.selectedLines[0];

      if (selected.type === 'pb') {
        this.selectedPb = selected.line;
        this.selectedLineUuid = `${selected.uuid}`;
        this.selectedOffsetFreeHand = this.freehand.collection.indexOf(selected.line);

        if (this.freehand.offset[this.selectedOffsetFreeHand]) {
          this.freehand.offset[this.selectedOffsetFreeHand].show();
        }
      } else {
        this.selectedLine = selected.line;
        this.selectedLineUuid = `${selected.uuid}`;
        this.selectedOffsetPoly = this.polyLine.lines.indexOf(selected.line);

        if (this.polyLine.offset[this.selectedOffsetPoly]) {
          this.polyLine.offset[this.selectedOffsetPoly].show();
        }
      }
    }

    if (this.selectedLines.length === 0) {
      this.clearSelection();
    }
  };

  findLine = () => {
    if (this.selectedPb) {
      this.lineToUpdate = this.selectedPb.mesh;
    } else {
      this.lineToUpdate = this.polyLine.lines.find(
        (line) => line.uuid === this.editor.viewport.transformControl.attached.lineID
      );
    }
  };

  deleteLine = async (check = true, divide = true) => {
    if (this.selectedPb) {
      if (check) {
        this.editor.recordStateForPencil();
      }
      // delete dimension tag
      for (let i = 0; i < this.freehand.offset.length; i++) {
        if (this.freehand.offset[i].index === this.selectedPb.uuid) {
          this.freehand.offset[i].clear();
          this.freehand.offset.splice(i, 1);
          break;
        }
      }
      // delete line
      const uuid = this.selectedPb.uuid;
      this.editor.viewport.scene.remove(this.selectedPb.mesh);
      this.selectedPb.mesh.geometry.dispose();
      this.selectedPb.mesh.material.dispose();
      this.freehand.collection = this.freehand.collection.filter((f) => f.uuid !== uuid);
      this.selectedPb = null;
      delete this.editor.state.drawnElements.axis[uuid];
      delete this.freehand.axis[uuid];
      if (divide) {
        await this.editor.divideSites();
      }
      if (check) {
        this.editor.updateLastUndoItem();
      }

      this.editor.handleSnap();
      this.selectedOffsetFreeHand = null;
    } else if (this.selectedLineUuid) {
      const selectedLine = this.polyLine.lines.find((line) => line.uuid === this.selectedLineUuid);
      if (check) {
        if (!selectedLine.userData.type) {
          this.editor.recordStateForPencil();
        }
      }
      // delete dimension tag

      for (let i = 0; i < this.polyLine.offset.length; i++) {
        if (this.polyLine.offset[i].index === this.selectedLineUuid) {
          this.polyLine.offset[i].clear();
          this.polyLine.offset.splice(i, 1);
          break;
        }
      }

      // if its a ruler line
      for (let i = 0; i < this.polyLine.dims.length; i++) {
        if (this.polyLine.dims[i].index === this.selectedLineUuid) {
          this.polyLine.dims[i].clear();
        }
      }
      this.polyLine.dims = this.polyLine.dims.filter((f) => f.index !== this.selectedLineUuid);

      // delete line

      for (const p of selectedLine.controlPoints) {
        this.editor.viewport.scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
      }

      this.editor.viewport.scene.remove(selectedLine);
      selectedLine.geometry.dispose();
      selectedLine.material.dispose();
      delete this.editor.state.drawnElements.axis[this.selectedLineUuid];
      delete this.polyLine.axis[this.selectedLineUuid];
      this.polyLine.lines = this.polyLine.lines.filter((f) => f.uuid !== this.selectedLineUuid);
      this.selectedLineUuid = null;
      if (!selectedLine.userData.type) {
        if (divide) {
          await this.editor.divideSites();
        }
        if (check) {
          this.editor.updateLastUndoItem();
        }
      }
      this.editor.handleSnap();
      this.selectedOffsetPoly = null;
    }
  };
  restorePolyline = (lines) => {
    const { axis } = lines;
    const keys = Object.keys(axis);
    this.polyLine.axis = axis;
    this.freehand.axis = axis;

    for (const key of keys) {
      const { points, type, width } = axis[key];

      if (type === 'spline') {
        this.freehand.restore(key, points, width);
      } else {
        this.polyLine.restore(key, points, width);
      }
    }
  };

  clearSelection = () => {
    if (this.selectedOffsetFreeHand !== null) {
      if (this.freehand.offset[this.selectedOffsetFreeHand]) {
        this.freehand.offset[this.selectedOffsetFreeHand].hide();
      }
    }
    if (this.selectedOffsetPoly !== null) {
      if (this.polyLine.offset[this.selectedOffsetPoly]) {
        this.polyLine.offset[this.selectedOffsetPoly].hide();
      }
    }

    this.selectedLineUuid = null;

    if (this.selectedLine) {
      this.selectedLine.material.dispose();
      this.selectedLine.material = LineMaterials.lineDeselected;
      this.selectedLine = null;
    }
    if (this.selectedPb) {
      this.selectedPb.mesh.material.dispose();
      this.selectedPb.mesh.material = LineMaterials.lineDeselected;
      this.selectedPb = null;
    }
  };

  deleteByUUID = async (params) => {
    const { divide } = params;
    this.selectedPb = null;
    for (const pb of this.freehand.collection) {
      this.selectedPb = pb;
      this.selectedLineUuid = `${pb.mesh.uuid}`;
      await this.deleteLine(false, divide);
    }
    this.selectedPb = null;
    for (const pl of this.polyLine.lines) {
      this.selectedLine = pl;
      this.selectedLineUuid = `${pl.uuid}`;
      await this.deleteLine(false, divide);
    }
  };

  deleteSelectedLines = async () => {
    this.selectedPb = null;
    this.selectedLine = null;
    this.selectedLineUuid = null;
    if (this.selectedLines.length > 0) {
      this.editor.recordStateForPencil();
    }
    for (const selected of this.selectedLines) {
      if (selected.type === 'pb') {
        this.selectedPb = selected.line;
        this.selectedLineUuid = `${selected.uuid}`;
        await this.deleteLine(false, true);
      } else {
        this.selectedLine = selected.line;
        this.selectedLineUuid = `${selected.uuid}`;
        await this.deleteLine(false, true);
      }
    }
    if (this.selectedLines.length > 0) {
      this.editor.updateLastUndoItem();
    }

    this.selectedLines = [];
  };

  clearSelectedLines = async () => {
    this.selectedPb = null;
    this.selectedLine = null;
    this.selectedLineUuid = null;
    for (const selected of this.selectedLines) {
      if (selected.type === 'pb') {
        this.selectedPb = selected.line;
        this.selectedLineUuid = `${selected.uuid}`;
      } else {
        this.selectedLine = selected.line;
        this.selectedLineUuid = `${selected.uuid}`;
      }
      this.clearSelection();
    }
    this.selectedLines = [];
  };
}

export default Pencil;
