import * as THREE from "three";
import { pointMaterialRed } from "./Materials.js";
import { getPoint } from "./getGeometries.js";
import { getDistance } from "./myMath.js";
import { scene } from "../Renderer";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

// grid parameters

// draw outer grid
let a = new THREE.Vector3(3000, 0, 3000);
let b = new THREE.Vector3(-3000, 0, 3000);
let c = new THREE.Vector3(-3000, 0, -3000);
let d = new THREE.Vector3(3000, 0, -3000);
let weightGridBoundary = [a, b, c, d];

export let weightGrid = getGrid(150, 150, weightGridBoundary);

console.log("weightGrid=", weightGrid);


// draw Road grid, hardcoded
export function getGrid(boundaryHeight, boundaryWidth) {
  let divisionX = 5;
  let divisionZ = 4;
  let intervalZ = boundaryHeight / divisionZ;
  let intervalX = boundaryWidth / divisionX;
  let gridMaterial = new LineMaterial({ color: 0xaaaaaa, linewidth: 5 });
  gridMaterial.resolution.set(window.innerWidth, window.innerHeight);

  let grid = new THREE.Group();
  for (
    let i = -boundaryWidth / 2 + intervalX;
    i < boundaryWidth / 2;
    i += intervalX
  ) {
    let line = new Line2(new LineGeometry(), gridMaterial);
    line.geometry.setPositions([
      i,
      0,
      -boundaryHeight / 2,
      i,
      0,
      boundaryHeight / 2,
    ]);
    grid.add(line);
  }

  for (
    let j = -boundaryHeight / 2 + intervalZ;
    j < boundaryHeight / 2;
    j += intervalZ
  ) {
    let line = new Line2(new LineGeometry(), gridMaterial);
    line.geometry.setPositions([
      -boundaryWidth / 2,
      0,
      j,
      boundaryWidth / 2,
      0,
      j,
    ]);
    grid.add(line);
  }
  return grid;
}

export function getWeightGridObj (weightGrid, pointMaterial = pointMaterialRed) {
  console.log("RedrawGrid");
  const newGrid = new THREE.Group();
  const newGridPoints = new THREE.Group();

  for (let i = 0; i < weightGrid.lineX.length; i++) {
    // scene.add(Grid.lineX[i])
    newGrid.add(weightGrid.lineX[i]);
  }
  for (let j = 0; j < weightGrid.lineZ.length; j++) {
    // scene.add(Grid.lineZ[j])
    newGrid.add(weightGrid.lineZ[j]);
  }
  for (let k = 0; k < weightGrid.points.length; k++) {
    newGridPoints.add(getPoint(weightGrid.points[k].point));
  }
  //getPoint(Grid.pt, pointMaterialRed)
  // console.log("newGrid=", newGrid);
  return { newGrid, newGridPoints };
}

export function initweightGridObj(weightGrid) {
  let weightGridObj = getWeightGridObj(weightGrid);
  return weightGridObj;
}

function shapeChangeGrid(weightGrid, params, threshold) {
  // step 1: iterate all the points of the grid
  for (let i = 0; i < weightGrid.points.length; i++) {
    let gridPtX = weightGrid.points[i].point.x;
    let gridPtZ = weightGrid.points[i].point.z;
    // step 2: get distance between all grid points and curve points
    let distance = getDistance(gridPtX, gridPtZ, params.pos.x, params.pos.z);
    //console.log(`gridPtX=${gridPtX},gridPtZ=${gridPtZ},crvPtX=${crvPtX},crvPtZ=${crvPtZ}`)
    //console.log("getDistance = ",distance)
    if (1 < distance < threshold) {
      weightGrid.points[i].wSize =
        weightGrid.points[i].wSize + params.size / distance;
    } else if (distance <= 1) {
      weightGrid.points[i].wSize = weightGrid.points[i].wSize + params.size;
    }
  }
}

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


// //redraw GridLines
// function redrawGrid(pointMaterial = pointMaterialRed) {
//   for (let i = 0; i < weightGrid.lineX.length; i++) {
//     scene.add(Grid.lineX[i]);
//   }
//   for (let j = 0; j < weightGrid.lineZ.length; j++) {
//     scene.add(Grid.lineZ[j]);
//   }
//   // for (k=0;k<Grid.points.length;k++){
//   //   drawPoint(Grid.points[k].point)
//   // }
//   for (let k = 0; k < weightGrid.points.length; k++) {
//     drawPoint(
//       weightGrid.points[k].point,
//       new THREE.PointsMaterial({
//         color: 0x30144255, //Set the color, default 0xFFFFFF
//         vertexColors: false, //Define whether the material uses vertex color, the default is false ---If this option is set to true, the color attribute is invalid
//         size: weightGrid.points[k].wSize * Math.random() * 100, //Define the size of the particles. The default is 1.0
//         transparent: true,
//         opacity: 1,
//       })
//     );
//   }
//   //drawPoint(Grid.pt, pointMaterialRed)
// }
