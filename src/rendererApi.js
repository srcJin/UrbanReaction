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
  getPolyline,
  getRectangle
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

export function drawCircle(x, y, size, material = new THREE.MeshBasicMaterial({ color: 0x800000 })) {
  console.log("drawCircle");
  // draw Attractor Curves
  scene.add(getCircle(x, y, size, material));
}

export function drawRectangle(x, y, width, height, material= new THREE.MeshBasicMaterial({ color: 0x800000 })) {
    console.log("drawRectangle");
    // draw Attractor Curves
    scene.add(getRectangle(x, y, width,height, material));
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

