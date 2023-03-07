import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import * as THREE from 'three';
const vertexColorsLine = new LineMaterial({
  color: 0xffffff,
  linewidth: 5, // in world units with size attenuation, pixels otherwise
  vertexColors: true,

  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const blueLine = new LineMaterial({
  color: 0x28d1f6,
  linewidth: 0.003, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  depthWrite: false,
  depthTest: false,
  transparent: true,
  opacity: 0.5,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});
const lightOrangeLine = new LineMaterial({
  color: 0xfa9c3f,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  depthWrite: false,
  depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const orangeLine = new LineMaterial({
  color: 0xff7100,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  depthWrite: false,
  depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const grayLine = new LineMaterial({
  color: 0x808080,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  // depthWrite: false,
  // depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const grayRulerLine = new LineMaterial({
  color: 0x808080,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  depthWrite: false,
  depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const borderMaterial = new THREE.MeshBasicMaterial({
  color: 0xff7101,
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: false,
  transparent: true,
});

const orangeMesh = new THREE.MeshBasicMaterial({ color: 0xff7101 });
const blueMesh = new THREE.MeshBasicMaterial({ color: 0x28d1f6 });
const whiteMesh = new THREE.MeshBasicMaterial({
  color: 'white',
  depthWrite: false,
  depthTest: false,
  transparent: true,
});

const dashedLineMaterial = new LineMaterial({
  color: '#808080',
  depthWrite: false,
  depthTest: false,
  transparent: true,
  linewidth: 0.002,
  dashed: true,
  dashSize: 0.5,
  gapSize: 0.5,
});
dashedLineMaterial.defines.USE_DASH = '';
// computeLineDistances to enable dashed line

const plotBuildableMaterial = new LineMaterial({
  color: 0xffffff,
  linewidth: 0.0012, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  // depthWrite: false,
  // depthTest: false,
  transparent: true,
  opacity: 0.5,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const plotShapeMaterial = new LineMaterial({
  color: 0xff7101,
  linewidth: 0.0012, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  // depthWrite: false,
  // depthTest: false,
  transparent: true,
  opacity: 0.5,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

// const shapeMaterial = new LineBasicMaterial({
//   color: 0xff7101,
//   linewidth: 2,
// });
// const buildableMaterial = new LineBasicMaterial({
//   color: 0xffffff,
//   linewidth: 2,
// });

const hoverBoundaryMaterial = new LineMaterial({
  color: 0xff7100,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  // depthWrite: false,
  // depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const lineDeselected = new LineMaterial({
  color: 0xffffff,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  // depthWrite: false,
  // depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const lineHovered = new LineMaterial({
  color: 0x3c84fe,
  linewidth: 0.002, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  depthWrite: false,
  depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const siteBoundaryMaterial = new LineMaterial({
  color: 0xffffff,
  linewidth: 0.001, // in world units with size attenuation, pixels otherwise
  vertexColors: false,
  // depthWrite: false,
  // depthTest: false,
  transparent: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: false,
});

const LineMaterials = {
  vertexColorsLine,
  blueLine,
  grayLine,
  lightOrangeLine,
  orangeLine,
  borderMaterial,
  orangeMesh,
  whiteMesh,
  blueMesh,
  dashedLineMaterial,
  grayRulerLine,
  plotBuildableMaterial,
  plotShapeMaterial,
  hoverBoundaryMaterial,
  lineDeselected,
  lineHovered,
  siteBoundaryMaterial,
};

export default LineMaterials;
