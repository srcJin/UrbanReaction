import * as THREE from 'three';
import { faceUtils } from './faceutils';
import { buildingDrawer } from './buildingDrawer.js';
import { polygonExtruder } from './polygonExtruder.js';
import { dataUtils } from './dataUtils.js';
import { mathUtils } from './mathUtils.js';
import { TextureBuilder } from './textureBuilder.js';
import { checkVec3PolygonDirection } from './buildingDrawer.js';

/**
 * Global variables
 */
// Variables for mesh face extrusion
let extrusionValue;

// Variables for buidling drawer
let currentSelectedFace;
let geometryToExtrude;
let selectedFacesOnHover = [];
let notSelectedFacesOnHover = [];
let currentEditedFace;

// Variables for safety checking if inner offset and outer offset does not intersect
let faceExtrusionLock = false;

// Building drawer parameters
let edgeExtrusionValue;
let edgeNumber;
let buildingExtrusionValue;
let isExtrudedBuildingOutline;

let buildingOutline;
let buildingInnerOutline;
let initBuildingOutline;

let block;
let building;

// Colors
const geometrySelectedColor = new THREE.Color(0xffff00);
const geometryEdgesColor = new THREE.Color(0xb7b7ef);

// Class instances
let faceTools; // Cooplanar faces detection util
let buildingDrawerInstance;
let polyExtruder = new polygonExtruder();
let dataUtilsInstance = new dataUtils();

// Edges helper material
const edgesMaterial = new THREE.LineBasicMaterial();
edgesMaterial.color = geometryEdgesColor;

/**
 * Models
 */

//Models for Plot transform control
let plotLines;

// Transform Control for face edit mode
let transformControlAttachmentGeometry = new THREE.SphereGeometry(0.3, 3, 2);
let transformControlAttachment_Faces = new THREE.Mesh(transformControlAttachmentGeometry);
transformControlAttachment_Faces.visible = false;

// Transform controls for Plot transform control
let transformControlAttachment_Plot;

export class BooleanEditor {
  //add initialisation on class start - use constructBuildingBlock funciton somewhere inside the class
  constructor(scene, transformControls, camera, colorCode, floorColortexture) {
    const scope = this;

    //scene controlls
    scope.scene = scene;
    scope.transformControls = transformControls;
    scope.camera = camera;
    // scope.intersects;

    scope.selectableObjects = [];
    scope.faceDragged = false;

    //geometry material properities
    scope.floorColortexture = floorColortexture;
    scope.colorCode = colorCode;

    // Geometry materials
    scope.geometryMaterial = new THREE.MeshPhongMaterial({
      side: THREE.FrontSide,
      vertexColors: true,
      flatShading: true,
    });

    scope.handlesMaterial = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
      flatShading: false,
      color: geometrySelectedColor,
    });

    // scope.buildingMainMesh;
    // // Currently edited block mesh uuid
    // scope.uuid;
    // scope.initBlockData;

    scope.scene.add(transformControlAttachment_Faces);
    scope.scene.add(scope.transformControls);
    scope.transformControls.setSpace('local');
    scope.transformControls.showY = false;

    scope.cache = {
      parent: null,
    };
  }

  initBuildingBlock(blockData) {
    buildingDrawerInstance = new buildingDrawer();

    // Import building block data
    block = this.readBlockData(blockData);
    this.uuid = blockData.reference.uuid;
    this.initBlockData = blockData;

    // Building drawer parameters
    initBuildingOutline = block.outline;
    edgeExtrusionValue = 0;
    edgeNumber = 1;
    buildingExtrusionValue = block.height;
    isExtrudedBuildingOutline = false;

    this.constructMesh(block);
    this.buildingMainMesh.uuid = this.uuid;

    this.recomputeMesh(this.buildingMainMesh, block, this.colorCode);

    this.refreshSelectableObjects(this.buildingMainMesh);
    // this.buildingMainMesh.geometry.applyMatrix4(this.initBlockData.props.transform)

    this.scene.add(this.buildingMainMesh);
  }

  faceEditMode() {
    if (faceExtrusionLock == false) {
      //Refresh building mesh during face offset or extrusion
      this.extrudeSide();

      this.extrudeFloor();

      this.clearMeshFromScene();

      this.buildingMainMesh = buildingDrawerInstance.drawBuildingFromOutline(
        buildingOutline,
        buildingExtrusionValue,
        edgeExtrusionValue,
        edgeNumber,
        isExtrudedBuildingOutline,
        this.geometryMaterial.clone(),
        block.innerOutline
      ).mesh;

      this.buildingMainMesh.position.set(block.position.x, block.position.y, block.position.z);

      this.scene.add(this.buildingMainMesh);

      this.recomputeMesh(this.buildingMainMesh, block, this.colorCode);
      // this.buildingMainMesh.geometry.applyMatrix4(this.initBlockData.props.transform)
    }
    /**
     *  Extrusion of mesh faces
     */
    // clearMeshFromScene()
    // extrusionValue = polyExtruder.setMeshFaceExtrusionValue(currentSelectedFace, geometryToExtrude, transformControlAttachment_Faces)
    // onStartFaceDrag(currentSelectedFace, geometryToExtrude)
    // recomputeMesh()
  }

  checkBuildingPlotColision() {
    buildingDrawer.checkBuildingPlotColision(
      buildingOutline,
      this.getPlotHandlesPosition(transformControlAttachment_Plot),
      this.geometryMaterial
    );
  }

  constructMesh(block) {
    //for now it runs only in the initialisation function

    building = buildingDrawerInstance.drawBuildingFromOutline(
      block.outline,
      buildingExtrusionValue,
      edgeExtrusionValue,
      edgeNumber,
      isExtrudedBuildingOutline,
      this.geometryMaterial.clone(),
      block.innerOutline
    );

    buildingOutline = building.outline;
    buildingInnerOutline = building.innerOutline;

    this.buildingMainMesh = building.mesh;

    this.buildingMainMesh.position.set(block.position.x, block.position.y, block.position.z);

    this.buildingMainMesh.block = block;
  }

  highlightFaceOnHover(intersects) {
    this.refreshSelectableObjects(intersects[0].object);
    faceTools = new faceUtils();

    if (intersects.length > 0) {
      // If face edit mode, turn on the face intersection

      this.intersects = intersects;

      let faces = intersects[0].object.geometry.faces;
      let face = intersects[0].face;

      //Filling the notSelectedFaceIndexes array with numbers
      for (var i = 0; i < faces.length; i++) {
        notSelectedFacesOnHover.push(i);
      }

      currentSelectedFace = face;
      geometryToExtrude = intersects[0].object.geometry;

      faceTools.onCoplanar = function (rfaces) {
        for (var i in rfaces) {
          selectedFacesOnHover.push(faces.indexOf(rfaces[i]));
          rfaces[i].color.setHex(geometrySelectedColor.getHex());
        }
      };

      //params: maxangle, geometry, picked face
      faceTools.getCoplanar(1, intersects[0].object.geometry, face);

      notSelectedFacesOnHover = notSelectedFacesOnHover.filter((el) => !selectedFacesOnHover.includes(el));

      for (var i = 0; i < notSelectedFacesOnHover.length; i++) {
        faces[notSelectedFacesOnHover[i]].color.setHex(this.colorCode.getHex());
      }

      selectedFacesOnHover = [];
      notSelectedFacesOnHover = [];
    } else {
      this.resetFaceColorsOnHoverEnd();
    }

    this.buildingMainMesh.geometry.colorsNeedUpdate = true;
    intersects[0].object.geometry.colorsNeedUpdate = true;
  }

  resetFaceColorsOnHoverEnd() {
    if (!this.buildingMainMesh) {
      return;
    }
    for (var i in this.buildingMainMesh.geometry.faces) {
      this.buildingMainMesh.geometry.faces[i].color.setHex(this.colorCode.getHex());
    }
  }

  placeTransformControlsFaceMode() {
    faceExtrusionLock = false;

    this.faceDragged = false;

    let intersects = this.intersects;

    if (intersects.length > 0) {
      // If face edit mode, turn on the face intersection

      transformControlAttachment_Faces.position.set(
        intersects[0].point.x,
        intersects[0].point.y,
        intersects[0].point.z
      );

      //Reset rotation and alingement of transform controll
      let rotationReset = new THREE.Quaternion();
      transformControlAttachment_Faces.setRotationFromQuaternion(rotationReset);

      this.transformControls.setSpace('local');

      let newDirection = intersects[0].face.normal;
      let position = new THREE.Vector3();
      position.addVectors(newDirection, transformControlAttachment_Faces.position);

      transformControlAttachment_Faces.lookAt(position);

      this.transformControls.showX = false;
      this.transformControls.showY = false;
      this.transformControls.showZ = true;

      this.transformControls.attach(transformControlAttachment_Faces);
      this.scene.add(this.transformControls);

      currentEditedFace = buildingDrawerInstance.selectedBuildingFaceID(
        buildingOutline,
        buildingInnerOutline,
        transformControlAttachment_Faces
      );
    }
  }

  //Final exit function so we need to update entire thing - block mesh, mesh and outline
  exitEditMode() {
    let editedBlockData = this.saveBlockData(this.initBlockData, block);

    this.clearMeshFromScene();

    this.buildingMainMesh = undefined;
    buildingOutline = undefined;
    buildingInnerOutline = undefined;
    initBuildingOutline = undefined;

    buildingDrawerInstance = undefined;
    building = undefined;

    return editedBlockData;
  }

  //code to extrude the building edge
  extrudeSide() {
    if (currentSelectedFace.normal.y != 1 && currentSelectedFace.normal.y != -1) {
      if (currentEditedFace.edgeNO != undefined && currentEditedFace.isOutlineSelected != undefined) {
        edgeNumber = currentEditedFace.edgeNO;
        isExtrudedBuildingOutline = currentEditedFace.isOutlineSelected;
      } else {
        edgeExtrusionValue = 0;
      }

      if (this.faceDragged == false) {
        edgeExtrusionValue = mathUtils.roundToStep(
          buildingDrawerInstance.setBuildingEdgeExtrusionValue(
            currentSelectedFace,
            geometryToExtrude,
            transformControlAttachment_Faces
          ),
          0.1
        );
      } else {
        edgeExtrusionValue = 0;
      }
    }
  }

  //code to extrude the floor by fixed increment
  extrudeFloor() {
    if (currentSelectedFace.normal.y == 1) {
      edgeExtrusionValue = 0;

      //get current extrusion value, round it to nearest floor heigh and lerp both values to get smooth transition
      let nearestFloorHeight = mathUtils.roundToStep(
        transformControlAttachment_Faces.position.y - block.position.y,
        block.floorHeight
      );
      let currentValue = new THREE.Vector3(0, buildingExtrusionValue, 0);
      let lerpValue = currentValue.lerp(new THREE.Vector3(0, nearestFloorHeight, 0), 0.25);
      buildingExtrusionValue = lerpValue.y;

      block.floorQuantity = buildingExtrusionValue / block.floorHeight;
    } else if (currentSelectedFace.normal.y == -1) {
      edgeExtrusionValue = 0;
    }

    if (buildingExtrusionValue < block.floorHeight) {
      buildingExtrusionValue = block.floorHeight;
    }
  }

  //Refresh building outline when finished dragging, only once
  refreshBuildingBlockOnMouseUp() {
    building = buildingDrawerInstance.drawBuildingFromOutline(
      initBuildingOutline,
      buildingExtrusionValue,
      edgeExtrusionValue,
      edgeNumber,
      isExtrudedBuildingOutline,
      this.geometryMaterial,
      block.innerOutline
    );

    buildingOutline = building.outline;
    buildingInnerOutline = building.innerOutline;

    buildingDrawerInstance.useRecomputedOutline(buildingOutline);
    buildingDrawerInstance.useRecomputedInnerOutline(buildingInnerOutline);
  }

  /**
   * Scene utils
   */
  clearMeshFromScene() {
    /*const parent = this.buildingMainMesh.parent
        parent.remove(this.buildingMainMesh)*/

    //console.log('buildingMainMesh:: ', this.buildingMainMesh)
    this.scene.remove(this.buildingMainMesh);

    this.buildingMainMesh.geometry.dispose();
    this.buildingMainMesh.material.dispose();
  }

  //Recompute main mesh
  recomputeMesh(mesh, block, colorCode) {
    //Recompute faces color
    for (var i = 0; i < mesh.geometry.faces.length; i++) {
      mesh.geometry.faces[i].color.setHex(colorCode.getHex());
    }

    let meshEdges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgesMaterial);
    mesh.add(meshEdges);

    faceUtils.computeNewBoxProjectedUVs(
      this.buildingMainMesh.geometry,
      new THREE.Matrix4().copy(this.buildingMainMesh.matrix).invert(),
      block.floorHeight
    );

    // Recompute procedural building texture
    // the block should have property called slabThickness
    this.floorColortexture = TextureBuilder.createColorTexture(block.floorHeight, 0.9, '#ffffff', '#000000', false); //(block, block.slabThickness))
    this.floorColortexture = TextureBuilder.adjustTexture(this.floorColortexture, 0.5);

    mesh.material.map = this.floorColortexture;
  }

  refreshSelectableObjects(buildingMainMesh) {
    this.selectableObjects = [];
    this.selectableObjects.push(buildingMainMesh);
  }

  /**
   * Reading building data from json
   */
  readBlockData(blockData) {
    let block;

    // Block solution data
    let buildingFloorHeight = 3;
    let buildingFloorQuantity = Math.ceil(blockData.props.height / 3);
    let buildingInnerOutlineArray = null;

    const mPos = new THREE.Vector3(),
      mQuat = new THREE.Quaternion(),
      mScale = new THREE.Vector3();

    blockData.props.transform.decompose(mPos, mQuat, mScale);
    mQuat._x = 0;
    mQuat._z = 0;
    mPos.y = 0;

    const mSimplified = new THREE.Matrix4();
    mSimplified.compose(mPos, mQuat, mScale);

    blockData.props.mSimplified = mSimplified;

    // console.log('Decompose:: ', mPos, mQuat, mScale, mSimplified)

    let buildingOutlineArray = blockData.props.shape.map((pt) => {
      pt = pt.isVector3 ? pt : new THREE.Vector3(pt.x, pt.y, pt.z);
      return pt.clone().applyMatrix4(mSimplified);
    });
    let buildingHeight = buildingFloorHeight * buildingFloorQuantity;
    let buildingSlabThickness = 0.5;
    let buildingPosition = blockData.props.translation;

    // Converted shape data to vector3 - needed for buildingDrawer
    let buildingOutlineVec3 = dataUtilsInstance.getVec3FromJSONShapeData(buildingOutlineArray);
    let buildingInnerOutlineVec3;
    if (buildingInnerOutlineArray != undefined) {
      buildingInnerOutlineVec3 = dataUtilsInstance.getVec3FromJSONShapeData(buildingInnerOutlineArray);
    }

    return (block = {
      floorHeight: buildingFloorHeight,
      floorQuantity: buildingFloorQuantity,
      outline: buildingOutlineVec3,
      innerOutline: buildingInnerOutlineVec3,
      height: buildingHeight,
      slabThickness: buildingSlabThickness,
      position: buildingPosition,
    });
  }

  saveBlockData(blockData, block) {
    blockData.props.height = mathUtils.roundToStep(block.floorQuantity * 3, 1);

    if (checkVec3PolygonDirection(buildingOutline) == true) {
      blockData.props.shape = buildingOutline.reverse();
    } else {
      blockData.props.shape = buildingOutline;
    }

    if (blockData.props.transform) {
      blockData.props.shape = blockData.props.shape.map((pt) =>
        pt.clone().applyMatrix4(blockData.props.mSimplified.clone().invert())
      );
    }

    return blockData;
  }
}
