import * as THREE from "three";
import { pointMaterialRed } from "./Materials.js";
import { getPoint } from "./getGeometries.js";
import { getDistance } from "./myMath.js";
import { scene } from "../Renderer";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { getLineLength,evaluateCrv,checkLineIntersection } from "./myMath.js";
import { getLine } from "./getGeometries.js";
// grid parameters

// draw outer grid
let a = new THREE.Vector3(3000, 0, 3000);
let b = new THREE.Vector3(-3000, 0, 3000);
let c = new THREE.Vector3(-3000, 0, -3000);
let d = new THREE.Vector3(3000, 0, -3000);
let weightGridBoundary = [a, b, c, d];

export let weightGrid = getGrid(150, 150, weightGridBoundary);

console.log("weightGrid=", weightGrid);

// modified getGrid
export function getGrid(xoff, yoff, polygon) {
  console.log("get grid");
  var grid = [];
  var lineX = [];
  var lineZ = [];
  // step one, set points, note this only works for 4 sided polygon
  var a = polygon[0];
  var b = polygon[1];
  var c = polygon[2];
  var d = polygon[3];
  console.log("getGrid, polygon=", polygon);
  // step two, calculate length of curve to determine number of divisions
  var ab_length = getLineLength(a.x, a.z, b.x, b.z);
  var cd_length = getLineLength(c.x, c.z, d.x, d.z);
  var ab_ac_avg = (ab_length + cd_length) / 2;
  var div1 = (ab_ac_avg - (ab_ac_avg % xoff)) / xoff;

  var bc_length = getLineLength(c.x, c.z, b.x, b.z);
  var da_length = getLineLength(a.x, a.z, d.x, d.z);
  var da_bc_avg = (da_length + bc_length) / 2;
  var div2 = (da_bc_avg - (da_bc_avg % xoff)) / xoff;

  // step three,
  for (var i = 1; i < div1; i++) {
    // i and j are parameters along curve
    for (var j = 1; j < div2; j++) {
      // i and j are parameters along curve
      // x axis
      var ab = evaluateCrv(b, a, i / div1);
      var cd = evaluateCrv(c, d, i / div1);

      // y axis // seems to be working
      var cb = evaluateCrv(b, c, j / div2);
      var da = evaluateCrv(a, d, j / div2);
      let material = new LineMaterial({
        color: 0xaaaaaa,
        linewidth: 1,
      });
      lineX.push(getLine(ab, cd, material));
      lineZ.push(getLine(cb, da, material));

      // calculate intersection
      var pt = checkLineIntersection(
        ab.x,
        ab.z,
        cd.x,
        cd.z,
        cb.x,
        cb.z,
        da.x,
        da.z
      );

      // console.log(point)
      if (pt) {
        var ptObj = {
          point: new THREE.Vector3(pt.x, 0, pt.y),
          wHeight: 1,
          wSize: 1,
          wProgram: 1,
        };
      }
      grid.push(ptObj);
    }
  }
  console.log("getGrid return=",{ points: grid, lineX: lineX, lineZ: lineZ });
  return { points: grid, lineX: lineX, lineZ: lineZ };
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
