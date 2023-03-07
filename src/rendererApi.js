import { scene } from "./Renderer";
import * as THREE from "three";

import {
  getCurve,
  getCircle,
  getStar,
  getPoint,
  getBoundary,
  getLine,
  getWeightGrid,
  getGrid,
  getPolyline,
  getRectangle
} from "./renderer/getGeometries.js";

import { returnWeightGrid, setWeightGrid } from "./MyTools";
import { curveChangeGrid, shapeChangeGrid } from "./renderer/GridEditor";

export function drawCurve(controlPoints) {
  console.log("star");
  // draw Attractor Curves
  let curveObj = getCurve(controlPoints)
  let curve = curveObj.line2
  // change the weightGrid from curve
  curveChangeGrid(returnWeightGrid(), curveObj.points,500)
  scene.add(curve);
}

export function drawStar(x, y, size) {
  console.log("star");
  let shape = getStar(x, y, size)
  scene.add(shape);
  let type = "star"
  shapeChangeGrid(returnWeightGrid(), type ,shape, size)
}

export function drawCircle(x, y, size, material = new THREE.MeshBasicMaterial({ color: 0xFE8484 })) {
  console.log("drawCircle");
  // draw Attractor Curves
  let shape = getCircle(x, y, size, material)
  let type = "circle"
  scene.add(shape);
  shapeChangeGrid(returnWeightGrid(), type, shape, size)
}

export function drawRectangle(x, y, width, height, material= new THREE.MeshBasicMaterial({ color: 0xFE8484 })) {
    console.log("drawRectangle");
    let type = "rectangle"
    // draw Attractor Curves
    let shape = getRectangle(x, y, type, width, height, material)
    let size = width * height
    scene.add(shape);
    shapeChangeGrid(returnWeightGrid(), type, shape, size)
}

export function drawBoundary(height, width) {
  console.log("star");
//   let a = new THREE.Vector3(0,0,0)
  let a = new THREE.Vector3(-1000,0,1000)
  let b = new THREE.Vector3(1000,0,1000)
  let c = new THREE.Vector3(1600,0,600)
  let d = new THREE.Vector3(1000,0,-1000)
  let e = new THREE.Vector3(-1000,0,-1000)

  let pointList = [a,b,c,d,e]
  scene.add(getPolyline(pointList, true));
}

export function drawWeightGrid(returnWeightGrid) {
  // draw weight Grid
  // process the input array into three object groups
  const newGrid = new THREE.Group();
  const newGridPoints = new THREE.Group();
  for (let i = 0; i < returnWeightGrid.lineX.length; i++) {
    // scene.add(Grid.lineX[i])
    newGrid.add(returnWeightGrid.lineX[i]);
  }
  for (let j = 0; j < returnWeightGrid.lineZ.length; j++) {
    // scene.add(Grid.lineZ[j])
    newGrid.add(returnWeightGrid.lineZ[j]);
  }
  for (let k = 0; k < returnWeightGrid.points.length; k++) {
    // console.log("weightGrid.points[k].wSize=",weightGrid.points[k].wSize);
    newGridPoints.add(getPoint(returnWeightGrid.points[k].point, returnWeightGrid.points[k].wSize, returnWeightGrid.points[k].wProgram, returnWeightGrid.points[k].wDensity, returnWeightGrid.points[k].wHeight));

  }

  scene.add(newGrid);
  scene.add(newGridPoints);

}