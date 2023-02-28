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
  getGrids,
  getPolyline
} from "./renderer/getGeometries.js";


export function drawStar(x, y, size) {
  console.log("star");
  scene.add(getStar(x, y, size));
}

export function drawCurve(controlPoints) {
  console.log("star");
  // draw Attractor Curves
  scene.add(getCurve(controlPoints));
}

export function drawCircle(x, y, size) {
  console.log("star");
  // draw Attractor Curves
  scene.add(getCircle(x, y, size));
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

