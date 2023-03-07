import * as THREE from "three";
import React, { Component } from "react";
import "./Buttons.css";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import * as GeometryUtils from "three/addons/utils/GeometryUtils.js";
// import { handlePencil } from "./Editor";

import {
  getCurve,
  getCircle,
  getStar,
  getPoint,
  getBoundary,
  getLine,
  getWeightGrid,
  getGrid,
} from "./renderer/getGeometries.js";

const params = {
  uniform: true,
  tension: 0.5,
  centripetal: true,
  chordal: true,
  // addPoint: addPoint,
  // removePoint: removePoint,
  // exportSpline: exportSpline
};

//
// create a new scene
//
export let scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

//
// start camera
//
//let camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
export let camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  1,
  50000
);
camera.position.set(0, 10000, 0);

//
// start lighting
//
scene.add(new THREE.AmbientLight(0xf0f0f0, 0.5));
let light = new THREE.SpotLight(0xffffff, 0.5);
light.position.set(3000, 3000, 3000);
light.angle = Math.PI * 0.2;
light.castShadow = true;
light.shadow.camera.near = 200;
light.shadow.camera.far = 2000;
light.shadow.bias = -0.000222;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light);

//
// start geometries
//
// start helper grid
// new THREE.GridHelper( size, divisions );
const helper = new THREE.GridHelper(2000, 40);
helper.position.y = 0;
helper.material.opacity = 0.25;
helper.material.transparent = true;
scene.add(helper);

//
// start renderer
export let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
// start animation
export let animate = function () {
  requestAnimationFrame(animate);
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};

//
// start Controls
//
const controls = new OrbitControls(camera, renderer.domElement);
controls.damping = 0.2;

let transformControl = new TransformControls(camera, renderer.domElement);
controls.enabled = true;
scene.add(transformControl);

// try handlePencil
// handlePencil('SPLINE')

// start learn from sketch.js

let raycaster = new THREE.Raycaster();
let raycastPlane = new THREE.Plane(new THREE.Vector3(0, 100, 0), 0);
let tempPointArr = [];
let tempCount = 0;
// current freehandline
let freeHandLine = null;
let isDrawing = false;


// const raycast = () => {
//   raycaster.setFromCamera(viewport.mouse, camera);
//   return raycaster.ray.intersectPlane(raycastPlane, new THREE.Vector3());
// };

// function resetTempValues() {
//   let tempPointArr = [];
//   let tempCount = 0;
//   let polygonLine = null;
//   let tempPolygonLine = null;
//   let freeHandLine = null;
// }

// const toggleFreehand = () => {
//   const isDrawing = !isDrawing;
//   if (isDrawing) {
//     resetTempValues();

//     domElement.addEventListener('mousedown', startFreehand, false);
//     domElement.addEventListener('touchstart', startFreehand, false);

//     domElement.addEventListener('mouseup', stopFreehand, false);
//     domElement.addEventListener('touchend', stopFreehand, false);
//   } else {
//     resetTempValues();
//     viewport.setOrbit(true);

//     domElement.removeEventListener('mousedown', startFreehand, false);
//     domElement.removeEventListener('touchstart', startFreehand, false);

//     domElement.removeEventListener('mouseup', stopFreehand, false);
//     domElement.removeEventListener('touchend', stopFreehand, false);
//   }
// };

// const startFreehand = () => {
//   domElement.addEventListener('mousemove', updateFreehand, false);
//   domElement.addEventListener('touchmove', updateFreehand, false);
//   const pos = raycast();
//   tempPointArr.push(pos);
// };

// const updateFreehand = () => {
//   if (tempCount === MOUSE_MOVE_UPDATE_INTERVAL) {
//     tempCount = 0;
//     if (freeHandLine) {
//       viewport.scene.remove(freeHandLine);
//       freeHandLine.geometry.dispose();
//       freeHandLine.material.dispose();
//       freeHandLine = null;
//     }

//     const pos = raycast();
//     tempPointArr.push(pos);

//     const geometry = new THREE.BufferGeometry().setFromPoints(tempPointArr);
//     const freeHandLine = new THREE.Line(geometry, basicLineMaterials.black04);
//     freeHandLine = freeHandLine;
//     viewport.scene.add(freeHandLine);
//   }
//   tempCount++;
// };

// const stopFreehand = () => {
//   domElement.removeEventListener('mousemove', updateFreehand, false);
//   domElement.removeEventListener('touchmove', updateFreehand, false);

//   // remove existing freeHandLine
//   if (freeHandLine) {
//     viewport.scene.remove(freeHandLine);
//     freeHandLine.geometry.dispose();
//     freeHandLine.material.dispose();
//     freeHandLine = null;
//   }

//   const geometry = new THREE.BufferGeometry().setFromPoints(tempPointArr);
//   const freeHandLine = new THREE.Line(geometry, basicLineMaterials.black04);
//   freeHandLine.name = 'sketch';
//   viewport.scene.add(freeHandLine);

//   editor.addSketchData({ uuid: freeHandLine.uuid, type: 'freehand', points: tempPointArr });

//   resetTempValues();
// };

//
// start GUI
//
const gui = new GUI();

gui.add(params, "uniform");
gui.add(params, "centripetal");
gui.add(params, "chordal");

gui.close();
