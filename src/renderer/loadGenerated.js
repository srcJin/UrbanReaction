import * as THREE from "three";
import { materialPink, buildingMaterial, waterMaterial } from "./Materials.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import axios from "axios";
import { setMesh, getPolyline } from "./getGeometries";
// import blocks from "./blocks.json";
import { weightGrid } from "./GridEditor.js";
import { getDistance } from "./myMath.js";

function convertGeneratedPointListToThreeVectorList(list, scale = 1) {
  let threePointList = [];
  for (let i = 0; i < list.length; i++) {
    let newCurvePoints = [];
    for (let j = 0; j < list[i].length; j++) {
      newCurvePoints.push(
        // here 2000 is an offset value
        new THREE.Vector3(
          list[i][j].x * scale - 2000,
          0,
          list[i][j].y * scale - 2000
        )
      );
    }
    threePointList.push(newCurvePoints);
  }
  //console.log("resultList=", threePointList)
  return threePointList;
}

export function convertJSONToPolyline(
  object,
  material = new LineMaterial({
    color: 0xff0000,
    linewidth: 5, // in pixels
    resolution: 1, // set the resolution of the derivative in pixels
    dashed: false,
  }),
  scale = 4
) {
  // console.log("object=",object);

  let threeGeometry = convertGeneratedPointListToThreeVectorList(object, scale);
  // console.log("threeGeometry=",threeGeometry);
  let group = new THREE.Group();
  for (let line of threeGeometry) {
    // console.log(line);
    group.add(getPolyline(line, false, material));
  }
  return group;
}

export function convertJSONToMeshes(object, material, scale = 4) {
  let blocksThree = convertGeneratedPointListToThreeVectorList(object, scale);
  let output = redrawGeneratedMeshes(blocksThree, material);
  return output;
}

function redrawGeneratedMeshes(blocksThree, material) {
  //console.log("------------------------------------")
  //console.log("redrawBuildings!!!!!!!!!!!!!")

  let sumwSize = 0;
  let avgwSize = 0;
  let group = new THREE.Group();

  for (let i = 0; i < blocksThree.length; i++) {
    group.add(setMesh(blocksThree[i], 1, material));
  }
  // console.log("group=",group);
  return group;
}
// redrawGeneratedContext(blocksThree)

function redrawGeneratedContext(blocksThree) {
  for (let i = 0; i < blocksThree.length; i++) {
    setMesh(
      blocksThree[i],
      40,
      new THREE.MeshPhongMaterial({
        color: 0x636363,
        transparent: false,
        opacity: 1,
      })
    );
  }

  //console.log("clipper.split_polygon(pList,ptl)=",clipperBlocks)
  for (let j = 0; j < blocksThree.length; j++) {
    setMesh(
      blocksThree[j],
      40,
      new THREE.MeshPhongMaterial({
        color: 0xa9a9a9,
        transparent: false,
        opacity: 1,
      })
    );
  }
}

export function convertJSONToBuildings(object, material, weightGrid, scale = 4) {
  let blocksThree = convertGeneratedPointListToThreeVectorList(object, scale);
  let processedBlocksThree = readNearbyPoints(weightGrid, blocksThree, 150);
  console.log(
    "redrawGeneratedContext,processedBlocksThree=",
    processedBlocksThree
  );
  let output = redrawGeneratedBuildings(processedBlocksThree, 100, material);
  return output;
}

export function readNearbyPoints(weightGrid, blocksThree, threshold) {
  //console.log("findCenterPoint blockPointLists=",blockPointLists)

  // get center points of building
  let centerPoint;
  // for each building in the list
  for (let i = 0; i < blocksThree.length; i++) {
    let sumX = 0;
    let sumZ = 0;
    let avgX = 0;
    let avgZ = 0;
    // for each point in a building, calculate average X and Z coordination
    for (let j = 0; j < blocksThree[i].length; j++) {
      sumX = sumX + blocksThree[i][j].x;
      sumZ = sumZ + blocksThree[i][j].z;
    }
    avgX = sumX / blocksThree[i].length;
    avgZ = sumZ / blocksThree[i].length;
    centerPoint = new THREE.Vector3(avgX, 0, avgZ);
    // add the block central points to the scene
    // scene.add(getPoint(centerPoint, pointMaterialRed));
    // add this parameter to objects
    blocksThree[i].centerPoint = centerPoint;
  }

  // now we have a grid made by central points of each
  // now get the nearbypoints for each block
  // initiate the nearbyPoints

  // read nearby points
  for (let k = 0; k < blocksThree.length; k++) {
    // initiate nearbyPoints array
    blocksThree[k].nearbyPoints = [];
    for (let m = 0; m < weightGrid.points.length; m++) {
      let gridPtX = weightGrid.points[m].point.x;
      let gridPtZ = weightGrid.points[m].point.z;
      // get distance between all grid points and mid points
      let distance = getDistance(
        gridPtX,
        gridPtZ,
        centerPoint.x,
        centerPoint.z
      );
      if (distance <= threshold) {
        // push the nearby points to the block object
        blocksThree[k].nearbyPoints.push(weightGrid.points[m]);
      }
    }
  }
  console.log("blockPointLists=", blocksThree);
  let processedBlocksThree = blocksThree;
  return processedBlocksThree;
}

function redrawGeneratedBuildings(blocksThree, heightScale = 1, material) {
  //console.log("------------------------------------")
  //console.log("redrawBuildings!!!!!!!!!!!!!")

  let sumwSize = 0;
  let baseHeight = 100;
  let avgwSize = 0;
  let group = new THREE.Group();
  console.log("redrawGeneratedBuildings blocksThree", blocksThree);

  for (let i = 0; i < blocksThree.length; i++) {
    // read weight

    // @todo redraw buildings load nearbyPoints

    sumwSize = baseHeight;

    for (let j = 0; j < blocksThree[i].nearbyPoints.length; j++) {
      // console.log(`blocksThree[${i}].nearbyPoints[${j}].wSize=${blocksThree[i].nearbyPoints[j].wSize}`)
      sumwSize = sumwSize + blocksThree[i].nearbyPoints[j].wSize * heightScale;
      //   // sumwSize = 100;
    }

    // avgwSize=sumwSize/blocksThree[i].nearbyPoints.length
    //console.log("redrawBuildings, avgwSize= ",avgwSize)
    group.add(setMesh(blocksThree[i], sumwSize, material));
  }
  // console.log("group=",group);
  return group;
}
