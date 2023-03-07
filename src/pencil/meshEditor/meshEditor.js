import * as THREE from 'three';
import { faceUtils } from './faceutils';
import { buildingDrawer } from './buildingDrawer.js';
import { polygonExtruder } from './polygonExtruder.js';
import { dataUtils } from './dataUtils.js';
import { mathUtils } from './mathUtils.js';
import { getIntersection } from '../clipper/clipper-tools';
import { TextureBuilder } from './textureBuilder.js';
// import { checkVec3PolygonDirection } from './buildingDrawer.js';
import { isClockWise, makeAntiClockwise } from '../math/math-tools';
import { changeFaceColor, getFaces, getIndexOfFace, getNormalForFace, getVertices } from '../geometry/conversionUtils';
import _, { cloneDeep } from 'lodash';
import { isClockwise } from 'poly-partition';

/**
 * Global variables
 */
// Variables for building drawer
let currentSelectedFace;
let geometryToExtrude;
let selectedFacesOnHover = [];
let notSelectedFacesOnHover = [];
let currentEditedFace;

// Building drawer parameters
let edgeNumber;
let buildingExtrusionValue;
let isExtrudedBuildingOutline;

let buildingOutline;
let buildingInnerOutline;
let initBuildingOutline;

let block;
let building;

// Colors
const geometrySelectedColor = new THREE.Color(0xff821f); //0xffff00
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

// Transform Control for face edit mode
let transformControlAttachmentGeometry = new THREE.SphereGeometry(0.3, 3, 2);
let transformControlAttachment_Faces = new THREE.Mesh(transformControlAttachmentGeometry);
transformControlAttachment_Faces.visible = false;

// Transform controls for Plot transform control
let transformControlAttachment_Plot;

export default class MeshEditor {
  //add initialization on class start - use constructBuildingBlock function somewhere inside the class
  constructor(scene, transformControls, camera, colorCode, floorColorTexture) {
    //scene controls
    this.scene = scene;
    this.transformControls = transformControls;
    this.camera = camera;
    this.intersects = null;

    this.selectableObjects = [];
    this.faceExtrusionLock = false;

    //geometry material properties
    this.floorColorTexture = floorColorTexture;
    this.colorCode = colorCode;

    this.geometryMaterial = null;
    this.handlesMaterial = null;

    this.buildingMainMesh = null;
    // Currently edited block mesh uuid
    this.uuid = null;
    this.initBlockData = null;
    this.recipe = null;

    this.edgeExtrusionValue = 0;

    this.scene.add(transformControlAttachment_Faces);
    //this.scene.add(this.transformControls);
    this.transformControls.setSpace('local');
    this.transformControls.showY = false;

    this.cache = {
      parent: null,
    };

    this.setMaterials();
  }

  setMaterials() {
    this.geometryMaterial = new THREE.MeshPhongMaterial({
      side: THREE.FrontSide,
      vertexColors: true,
      flatShading: true,
    });

    this.handlesMaterial = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
      //flatShading: false,
      color: geometrySelectedColor,
    });
  }

  initBuildingBlock(blockData) {
    buildingDrawerInstance = new buildingDrawer();

    // Import building block data
    block = this.readBlockData(blockData);
    this.recipe = _.cloneDeep(blockData);
    this.uuid = blockData.uuid;
    this.initBlockData = blockData;

    // Building drawer parameters
    initBuildingOutline = block.outline;
    edgeNumber = 1;
    buildingExtrusionValue = block.height;
    isExtrudedBuildingOutline = false;

    this.constructMesh(block);

    this.buildingMainMesh.uuid = this.uuid;

    this.recomputeMesh(this.buildingMainMesh, block, this.colorCode);

    this.scene.add(this.buildingMainMesh);
  }

  faceEditMode() {
    //Refresh building mesh during face offset or extrusion
    this.extrudeSide();
    this.extrudeFloor();
    this.clearMeshFromScene();

    this.buildingMainMesh = buildingDrawerInstance.drawBuildingFromOutline(
      buildingOutline,
      buildingExtrusionValue,
      this.edgeExtrusionValue,
      edgeNumber,
      isExtrudedBuildingOutline,
      this.geometryMaterial.clone(),
      block.innerOutline
    ).mesh;

    this.buildingMainMesh.recipe = _.cloneDeep(this.recipe);
    this.buildingMainMesh.uuid = this.recipe.uuid;

    this.buildingMainMesh.position.set(block.position.x, block.position.y, block.position.z);
    this.scene.add(this.buildingMainMesh);
    this.recomputeMesh(this.buildingMainMesh, block, this.colorCode);
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
    //for now it runs only in the initialization function

    building = buildingDrawerInstance.drawBuildingFromOutline(
      block.outline,
      buildingExtrusionValue,
      this.edgeExtrusionValue,
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
    this.faceExtrusionLock = false;

    faceTools = new faceUtils();

    if (intersects.length > 0) {
      // If face edit mode, turn on the face intersection

      this.intersects = intersects;

      const intersectedGeometry = intersects[0].object ? intersects[0].object.geometry : intersects[0].geometry;

      let faces = getFaces(intersectedGeometry);
      let face = intersects[0].face;

      //Filling the notSelectedFaceIndexes array with numbers
      for (let i = 0; i < faces.length; i++) {
        notSelectedFacesOnHover.push(i);
      }

      currentSelectedFace = face;
      geometryToExtrude = intersectedGeometry;

      faceTools.onCoplanar = function (rfaces) {
        for (let i in rfaces) {
          const idx = getIndexOfFace(faces, rfaces[i]);
          if (idx !== -1) {
            selectedFacesOnHover.push(idx);
            changeFaceColor(intersectedGeometry, rfaces[i], geometrySelectedColor);
          }

          // rfaces[i].color.setHex(geometrySelectedColor.getHex());
        }
      };

      // to check if face is null
      if (face) {
        const normal = getNormalForFace(face, intersectedGeometry);
        face.normal = normal;
        //params: maxangle, geometry, picked face
        faceTools.getCoplanar(1, intersectedGeometry, face);
      }

      notSelectedFacesOnHover = notSelectedFacesOnHover.filter((el) => !selectedFacesOnHover.includes(el));

      for (let i = 0; i < notSelectedFacesOnHover.length; i++) {
        changeFaceColor(intersectedGeometry, faces[notSelectedFacesOnHover[i]], this.colorCode);
        // faces[notSelectedFacesOnHover[i]].color.setHex(this.colorCode.getHex());
      }

      selectedFacesOnHover = [];
      notSelectedFacesOnHover = [];
    } else {
      this.resetFaceColorsOnHoverEnd();
    }

    this.buildingMainMesh.geometry.attributes.color.needsUpdate = true;
    if (intersects[0]?.object?.geometry.attributes.color) {
      intersects[0].object.geometry.attributes.color.needsUpdate = true;
    }

    this.buildingMainMesh.geometry.colorsNeedUpdate = true;
    if (intersects[0]?.object?.geometry) {
      intersects[0].object.geometry.colorsNeedUpdate = true;
    }
  }

  resetFaceColorsOnHoverEnd() {
    if (!this.buildingMainMesh) {
      return;
    }
    const faces = getFaces(this.buildingMainMesh.geometry);
    for (let i = 0; i < faces.length; i++) {
      changeFaceColor(this.buildingMainMesh.geometry, faces[i], this.colorCode);
    }
    // for (var i in this.buildingMainMesh.geometry.faces) {
    //   this.buildingMainMesh.geometry.faces[i].color.setHex(this.colorCode.getHex());
    // }
  }

  placeTransformControlsFaceMode() {
    let intersects = this.intersects;

    if (intersects && intersects.length > 0 && intersects[0].face) {
      // If face edit mode, turn on the face intersection

      transformControlAttachment_Faces.position.set(
        intersects[0].point.x,
        intersects[0].point.y,
        intersects[0].point.z
      );

      //Reset rotation and alinement of transform control
      let rotationReset = new THREE.Quaternion();
      transformControlAttachment_Faces.setRotationFromQuaternion(rotationReset);

      this.transformControls.setSpace('local');
      let newDirection = intersects[0].face.normal;
      let position = new THREE.Vector3();
      position.addVectors(newDirection, transformControlAttachment_Faces.position);
      transformControlAttachment_Faces.lookAt(position);
      transformControlAttachment_Faces.normal = newDirection;

      this.transformControls.showX = false;
      this.transformControls.showY = false;
      this.transformControls.showZ = true;

      this.transformControls.attach(transformControlAttachment_Faces);

      currentEditedFace = buildingDrawerInstance.selectedBuildingFaceID(
        buildingOutline,
        buildingInnerOutline,
        transformControlAttachment_Faces
      );
      this.faceExtrusionLock = true;
    }
  }

  //Final exit function so we need to update entire thing - block mesh, mesh and outline
  exitEditMode() {
    this.refreshBuildingBlock();
    let editedBlockData = this.saveBlockData(this.initBlockData, block);

    //when editing block, the circulation geometry is not changed and parts of the polygon can fall out of the floor boundary
    //let's fix this by intersecting the circulation with the changed floor boundary
    let circulation = getIntersection(editedBlockData.shape, this.initBlockData.circulation);
    //if the intersection is ok, let's assign it as a new circulation to edited block
    if (circulation && circulation.length > 0) editedBlockData.circulation = circulation;

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
    if (currentSelectedFace && currentSelectedFace.normal) {
      if (currentSelectedFace.normal.y != 1 && currentSelectedFace.normal.y != -1) {
        if (currentEditedFace.edgeNO != undefined && currentEditedFace.isOutlineSelected != undefined) {
          edgeNumber = currentEditedFace.edgeNO;
          isExtrudedBuildingOutline = currentEditedFace.isOutlineSelected;
        } else {
          this.edgeExtrusionValue = 0;
        }

        this.edgeExtrusionValue = mathUtils.roundToStep(
          buildingDrawerInstance.setBuildingEdgeExtrusionValue(
            currentSelectedFace,
            geometryToExtrude,
            transformControlAttachment_Faces
          ),
          0.1
        );
      }
    }
  }

  //code to extrude the floor by fixed increment
  extrudeFloor() {
    if (currentSelectedFace && currentSelectedFace.normal) {
      let epsilon = 0.0001;
      //check for normal.y === 1
      if (Math.abs(currentSelectedFace.normal.y - 1) <= epsilon) {
        this.edgeExtrusionValue = 0;

        //get current extrusion value, round it to nearest floor heigh and lerp both values to get smooth transition
        let nearestFloorHeight = mathUtils.roundToStep(
          transformControlAttachment_Faces.position.y - block.position.y,
          block.floorHeight
        );
        let currentValue = new THREE.Vector3(0, buildingExtrusionValue, 0);
        let lerpValue = currentValue.lerp(new THREE.Vector3(0, nearestFloorHeight, 0), 0.25);
        buildingExtrusionValue = lerpValue.y;

        block.floorQuantity = buildingExtrusionValue / block.floorHeight;
        //check for normal.y = -1
      } else if (Math.abs(currentSelectedFace.normal.y + 1) <= epsilon) {
        this.edgeExtrusionValue = 0;
      }
    }

    if (buildingExtrusionValue < block.floorHeight) {
      buildingExtrusionValue = block.floorHeight;
    }
  }

  //Refresh building outline when finished dragging, only once
  refreshBuildingBlock() {
    building = buildingDrawerInstance.drawBuildingFromOutline(
      initBuildingOutline,
      buildingExtrusionValue,
      this.edgeExtrusionValue,
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
    this.scene.remove(this.buildingMainMesh);

    this.buildingMainMesh.geometry.dispose();
    this.buildingMainMesh.material.dispose();
  }

  //Recompute main mesh
  recomputeMesh(mesh, block, colorCode) {
    //Recompute faces color

    //add color attribute for the BufferGeometry to apply the colors
    const vertices = getVertices(mesh.geometry);
    const vertexCount = vertices.length;

    // create color buffer with default color for newly selected geometry
    const colors = [];
    for (let i = 0; i < vertexCount; i += 1) {
      colors.push(colorCode.r, colorCode.g, colorCode.b);
    }
    mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // repaint the currently selected coplanar faces
    if (this.intersects) {
      faceTools = new faceUtils();

      let faces = getFaces(mesh.geometry);
      //some hack for detecting the top & bottom mesh faces
      //let find the face of a new mesh which is has nearly the same normal as current transform controls
      let face = faceTools.getFaceByNormal(faces, transformControlAttachment_Faces.normal);

      if (face) {
        faceTools.onCoplanar = function (rfaces) {
          for (let i in rfaces) {
            changeFaceColor(mesh.geometry, rfaces[i], geometrySelectedColor);
          }
        };

        faceTools.getCoplanar(1, mesh.geometry, face);
      }
    }

    mesh.geometry.attributes.color.needsUpdate = true;

    let meshEdges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgesMaterial);
    mesh.add(meshEdges);

    faceUtils.computeNewBoxProjectedUVs(
      this.buildingMainMesh.geometry,
      new THREE.Matrix4().copy(this.buildingMainMesh.matrix).invert(),
      block.floorHeight
    );

    // Recompute procedural building texture
    this.floorColorTexture = TextureBuilder.createColorTexture(block.floorHeight, 0.9, '#ffffff', '#000000', false);
    this.floorColorTexture = TextureBuilder.adjustTexture(this.floorColorTexture, 0.5);

    mesh.material.map = this.floorColorTexture;
  }

  /**
   * Reading building data from specimen
   */
  readBlockData(blockData) {
    // Block solution data
    let buildingFloorHeight = blockData.f2f;
    let buildingFloorQuantity = blockData.floors;
    let buildingOutlineArray = blockData.shape;
    let buildingInnerOutlineArray = blockData.holes[0];
    let buildingHeight = buildingFloorHeight * buildingFloorQuantity;
    let buildingSlabThickness = blockData.thickness;
    let buildingPosition = blockData.translation;
    // Converted shape data to vector3 - needed for buildingDrawer
    let buildingOutlineVec3 = dataUtilsInstance.getVec3FromJSONShapeData(buildingOutlineArray);
    let buildingInnerOutlineVec3;
    if (buildingInnerOutlineArray != undefined) {
      buildingInnerOutlineVec3 = dataUtilsInstance.getVec3FromJSONShapeData(buildingInnerOutlineArray);
    }

    return {
      floorHeight: buildingFloorHeight,
      floorQuantity: buildingFloorQuantity,
      outline: buildingOutlineVec3,
      innerOutline: buildingInnerOutlineVec3,
      height: buildingHeight,
      slabThickness: buildingSlabThickness,
      position: buildingPosition,
    };
  }

  saveBlockData(blockData, block) {
    blockData.floors = mathUtils.roundToStep(block.floorQuantity, 1);

    let blockDataIsClockWise = isClockWise(blockData.shape);
    let buildingOutlineIsClockWise = isClockWise(buildingOutline);

    //let's keep the direction of new building outline polygon the same as original one
    if (!blockDataIsClockWise && buildingOutlineIsClockWise) buildingOutline.reverse();
    if (blockDataIsClockWise && !buildingOutlineIsClockWise) buildingOutline.reverse();

    blockData.shape = buildingOutline;
    blockData.slab = buildingOutline;
    blockData.volume = buildingOutline;

    if (buildingInnerOutline !== undefined) {
      blockData.holes = [buildingInnerOutline];
    } else {
      blockData.holes = [];
    }

    if (blockData.parapet) {
      blockData.parapet = {
        holes: _.cloneDeep(blockData.holes),
        shape: _.cloneDeep(blockData.shape),
      };
    }

    return blockData;
  }

  // Function for mesh face extrusion, not the building edge offset
  // onStartFaceDrag(face, geometry) {
  //     faceTools = new faceUtils()

  //     const faceGroup = []
  //     const faceNormal = face.normal

  //     faceTools.onCoplanar = function (rfaces) {
  //         for (var i in rfaces) {
  //             faceGroup.push(rfaces[i])
  //         }
  //     }
  //     //params: maxangle, geometry, picked face
  //     faceTools.getCoplanar(1, geometry, face)

  //     // This function extrudes the mesh faces (in order to have clean polygon to extrude,
  //     // we use the 2D boolean union of all coplanar faces)
  //     buildingMainMesh = polyExtruder.faceExtrude(buildingMainMesh, geometry, faceGroup, extrusionValue, faceNormal, geometryMaterial)
  //     this.scene.add(buildingMainMesh)
  // }
}
