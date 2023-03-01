//import { clipper } from "./model/engine/clipper-ops";

import * as THREE from "three";
import { pointMaterialRed } from "./Materials.js";
import { getPoint, getGrid } from "./getGeometries.js";
import { getDistance } from "./myMath.js";
import { scene } from "../Renderer";

// draw outer grid
let a = new THREE.Vector3(3000, 0, 3000);
let b = new THREE.Vector3(-3000, 0, 3000);
let c = new THREE.Vector3(-3000, 0, -3000);
let d = new THREE.Vector3(3000, 0, -3000);
let weightGridBoundary = [a, b, c, d];
export let weightGrid = getGrid(150, 150, weightGridBoundary);

console.log("weightGrid=", weightGrid);

// function redrawLine(recordList, material = materialPink) {
//   if (recordList != []) {
//     console.log(`redrawLine Axis = ${recordList}`);
//     for (a = 0; a < recordList.length; a++) {
//       // console.log(recordList[a].geometry.vertices[0])
//       scene.add(
//         createStraightMeshLine(
//           recordList[a].geometry.vertices[0],
//           recordList[a].geometry.vertices[1],
//           material
//         )
//       );
//     }
//   } else {
//     console.log(`redrawLine Axis = empty list`);
//   }
// }

var pList = [
  new THREE.Vector3(-1000, 0, -800),
  new THREE.Vector3(-900, 0, 700),
  new THREE.Vector3(1000, 0, 1000),
  new THREE.Vector3(1000, 0, -1000),
];

// get mid points
export function readNearbyPoints(blockPointLists, threshold) {
  //console.log("findCenterPoint blockPointLists=",blockPointLists)

  // get center points of building
  let centerPoint;
  // for each building in the list
  for (let i = 0; i < blockPointLists.length; i++) {
    let sumX = 0;
    let sumZ = 0;
    // for each point in a building, calculate average X and Z coordination
    for (let j = 0; j < blockPointLists[i].length; j++) {
      sumX = sumX + blockPointLists[i][j].x;
      sumZ = sumZ + blockPointLists[i][j].z;
    }
    let avgX = sumX / blockPointLists[i].length;
    let avgZ = sumZ / blockPointLists[i].length;
    centerPoint = new THREE.Vector3(avgX, 0, avgZ);
    // console.log("centerPoint=",centerPoint)
    scene.add(getPoint(centerPoint, pointMaterialRed));
    // add this parameter to objects
    blockPointLists[i].centerPoint = centerPoint;
    blockPointLists[i].nearbyPoints = [];
  }

  // now we have a grid made by central points of each
  // now get the nearbypoints for each block
  // initiate the nearbyPoints

  // read nearby points
  for (let i = 0; i < blockPointLists.length; i++) {
    for (let k = 0; k < weightGrid.points.length; k++) {
      let gridPtX = weightGrid.points[k].point.x;
      let gridPtZ = weightGrid.points[k].point.z;
      // get distance between all grid points and mid points
      let distance = getDistance(
        gridPtX,
        gridPtZ,
        centerPoint.x,
        centerPoint.z
      );
      if (distance <= threshold) {
        //nearby.push(Grid.points[i])
        blockPointLists[i].nearbyPoints.push(weightGrid.points[i]);
      }
    }

    //console.log("centerPoint=",centerPoint)
  }
  console.log("blockPointLists=", blockPointLists);
}
// scan through the points and get nearby ones

// export function redrawBuildings() {
//   //console.log("------------------------------------")
//   //console.log("redrawBuildings!!!!!!!!!!!!!")
//   //console.log("------------------------------------")
//   //console.log("clipperBuilding=",clipperBuilding)
//   let meshGroup = new THREE.Group()
//   for (let i = 0; i < clipperBuilding.length; i++) {
//     // read weight
//     sumwSize = 0;
//     avgwSize = 0;
//     //console.log("clipperBuilding[j].nearbyPoints.length=",clipperBuilding[j].nearbyPoints.length)
//     // console.log("clipperBuilding[j].nearbyPoints[1].wSize",clipperBuilding[j].nearbyPoints[1].wSize)
//     for (let j = 0; j < clipperBuilding[i].nearbyPoints.length; j++) {
//       //console.log(`clipperBuilding[${i}].nearbyPoints[${j}].wSize=${clipperBuilding[i].nearbyPoints[j].wSize}`)
//       sumwSize = sumwSize + clipperBuilding[i].nearbyPoints[j].wSize;
//     }
//     avgwSize = sumwSize / clipperBuilding[i].nearbyPoints.length;
//     //console.log("redrawBuildings, avgwSize= ",avgwSize)
//     meshGroup.add(setMesh(clipperBuilding[i], avgwSize * 100));
//   }
//   return meshGroup
// }

// export function clearNearbyPoints(blockPointLists) {
//   for (let i = 0; i < blockPointLists.length; i++) {
//     blockPointLists[i].nearbyPoints = [];
//   }
// }

// export function redrawContext() {
//   // draw blockPointLists
//   let blockPointLists = clipper.split_polygon(pList, pLines, 1); // it has a limit of 2, can't be 0, will look later
//   //console.log("clipper.split_polygon(pList,ptl)=",blockPointLists)
//   meshGroup = new THREE.Group()

//   for (let i = 0; i < blockPointLists.length; i++) {
//     meshGroup.add(setMesh(
//       blockPointLists[i],
//       1,
//       new THREE.MeshPhongMaterial({
//         color: 0x636363,
//         transparent: false,
//         opacity: 1,
//       })
//     ));
//   }

//   // draw blocks
//   let clipperBlocks = clipper.split_polygon(pList, pLines, 30);
//   //console.log("clipper.split_polygon(pList,ptl)=",clipperBlocks)
//   for (let i = 0; i < clipperBlocks.length; i++) {
//     setMesh(
//       clipperBlocks[i],
//       10,
//       new THREE.MeshPhongMaterial({
//         color: 0xa9a9a9,
//         transparent: false,
//         opacity: 1,
//       })
//     );
//   }
// }
