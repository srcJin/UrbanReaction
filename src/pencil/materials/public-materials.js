/**

Digital Blue Foam (2017 - 2020 )
public-materials.js is used to standardize materials used in tool

- only materials in this file, NO methods

Updated July 4, 2020

 **/

import * as THREE from 'three';
//import { Geometry } from 'three/examples/jsm/deprecated/Geometry';
import { Geometry } from 'three_124';
// import { MeshLineMaterial } from 'three.meshline';
import { utils2D } from '../geometry/utils2D';
import MeshLineMaterial from '../MeshLineMaterial';

// Blues,Greens
const SwatchBlue = 0x029daf;
const SwatchGreen = 0xe5d599;
var indego = '#01091F';
const pGreen = '#2FC2A1';

// Trees
const green01 = 0x6ba249;
const green02 = 0x073828;
const green03 = 0x098b66;
const green04 = 0x4d774c;

// Yellow, Orange, Red

const SwatchOrange = 0xf07c19;
const SwatchYellow = 0xffc219;
const SwatchGold = 0x118ab2;
const SwatchPink = 0xe42251;
const pYellow = '#F8EE84';
const pOrange = '#F8EE84';
const pPink = '#CE3049';

// Greyscale

const pGrey = '#888888';

export const basicLineMaterials = {
  red04: new THREE.LineBasicMaterial({
    color: 'red',
    linewidth: 4,
    linecap: 'round',
    linejoin: 'round',
  }),

  black04: new THREE.LineBasicMaterial({
    color: 'black',
    linewidth: 4,
    linecap: 'round',
    linejoin: 'round',
  }),

  black03: new THREE.LineBasicMaterial({
    color: 'black',
    transparent: !0,
    opacity: 0.5,
    linewidth: 3,
    linecap: 'round',
    linejoin: 'round',
  }),

  black10: new THREE.LineBasicMaterial({
    color: 'black',
    linewidth: 10,
  }),

  blue03: new THREE.LineBasicMaterial({
    color: 0x7bcbb4,
    linewidth: 3,
    linecap: 'round',
    linejoin: 'round',
  }),

  darkBlue03: new THREE.LineBasicMaterial({
    color: 0x01091f,
    transparent: !0,
    opacity: 0.5,
    linewidth: 3,
    linecap: 'round',
    linejoin: 'round',
  }),

  green50: new THREE.LineBasicMaterial({
    color: 0x029daf,
    linewidth: 50,
  }),

  pink100: new THREE.LineBasicMaterial({
    color: 0xf8ee84,
    linewidth: 100,
  }),

  rainbowVomit: new THREE.LineBasicMaterial({
    color: 0xff00ff,
    linewidth: 100,
  }),

  highlight: new THREE.LineBasicMaterial({
    color: 0xdddddd,
    linewidth: 30,
  }),

  contextRoad: new THREE.LineBasicMaterial({
    color: 0x666666,
    transparent: !0,
    opacity: 0.5,
    linewidth: 3,
    linecap: 'round',
    linejoin: 'round',
  }),
};

export const roadMat = new THREE.LineBasicMaterial({
  color: 0x01091f,
  transparent: !0,
  opacity: 0.5,
  linewidth: 100,
});

export const railMat = new THREE.LineBasicMaterial({
  color: 0xeb4034,
  transparent: !0,
  opacity: 0.5,
  linewidth: 100,
});

export const bridgeMat = new THREE.LineBasicMaterial({
  color: 0x1b70cc,
  transparent: !0,
  opacity: 0.5,
  linewidth: 100,
});

export const crossingMat = new THREE.LineBasicMaterial({
  color: 0x8f8d8f,
  transparent: !0,
  opacity: 0.5,
  linewidth: 100,
});

export const bldgBaseMat = new THREE.LineBasicMaterial({
  color: 0x4586a8,
  transparent: !0,
  opacity: 0.5,
  linewidth: 100,
});

export const indigoLine = new THREE.LineBasicMaterial({
  color: 0x01091f,
  linewidth: 10,
});
export const shadowLine = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 50,
  transparent: !0,
  opacity: 0.5,
});
/*export const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xE42251,
    linewidth: 10,
})*/

export const waterMaterial = new THREE.LineBasicMaterial({
  color: 0x029daf,
  linewidth: 20,
});
export const waterwayMaterial = new THREE.MeshPhongMaterial({
  color: SwatchBlue,
  transparent: true,
  opacity: 0.2,
});

export const meshLineMaterials = {
  green: new MeshLineMaterial({
    color: 0x6b8e23,
    lineWidth: 1,
    transparent: !0,
    opacity: 1,
    sizeAttenuation: true,
  }),

  red: new MeshLineMaterial({
    color: 0xff0000,
    lineWidth: 1,
    transparent: !0,
    opacity: 1,
    sizeAttenuation: true,
  }),

  orange: new MeshLineMaterial({
    color: SwatchOrange,
    lineWidth: 1,
    transparent: !0,
    opacity: 1,
    sizeAttenuation: true,
  }),

  measure: new MeshLineMaterial({
    color: 0x34c6f5,
    lineWidth: 1,
    transparent: true,
    opacity: 1,
    sizeAttenuation: true,
  }),

  siteBorder: new MeshLineMaterial({
    color: 0x7f171f,
    lineWidth: 1,
    transparent: false,
    opacity: 1,
    sizeAttenuation: true,
  }),

  border: new MeshLineMaterial({
    color: 0x222222,
    lineWidth: 1,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  }),

  pin: new MeshLineMaterial({
    color: 0xffffff,
    lineWidth: 1,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  }),

  circle: new MeshLineMaterial({
    color: 0xffffff,
    transparent: true,
    lineWidth: 1,
    opacity: 0.5,
    sizeAttenuation: true,
  }),

  sunpath: new MeshLineMaterial({
    color: 'salmon',
    lineWidth: 1,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  }),
};

export const programMaterials = {
  anonymous: new THREE.MeshPhongMaterial({
    color: 0xffffff,
  }),

  park: new THREE.MeshPhongMaterial({
    color: 0x408f3b,
    transparent: true,
    opacity: 0.5,
    depthWrite: true,
  }),

  office: new THREE.MeshPhongMaterial({
    color: SwatchBlue,
  }),

  commercial: new THREE.MeshPhongMaterial({
    color: SwatchYellow,
  }),

  school: new THREE.MeshPhongMaterial({
    color: SwatchPink,
  }),

  residential: new THREE.MeshPhongMaterial({
    color: 0x264653,
  }),

  hotel: new THREE.MeshPhongMaterial({
    color: 0x264653,
  }),

  apartments: new THREE.MeshPhongMaterial({
    color: 0x264653,
  }),

  civic: new THREE.MeshPhongMaterial({
    color: SwatchGold,
  }),

  landmark: new THREE.MeshPhongMaterial({
    color: 0xe32551,
  }),

  museum: new THREE.MeshPhongMaterial({
    color: 0xe32551,
  }),

  nightlife: new THREE.MeshPhongMaterial({
    color: SwatchGold,
  }),

  train: new THREE.MeshPhongMaterial({
    color: pGrey,
  }),

  service: new THREE.MeshPhongMaterial({
    color: pGrey,
  }),
  construction: new THREE.MeshPhongMaterial({
    color: 'black',
  }),
};

// anonymous
// commercial
// office
// apartments
// hotel
// residential
// construction
// service
// museum

export const standardMaterials = {
  bluefoam: new THREE.MeshStandardMaterial({
    color: 0x34c6f5,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x34c6f5,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  }),

  selection: new THREE.MeshStandardMaterial({
    color: 0xff7272,
    roughness: 0,
    metalness: 1,
    emissive: 0xff7272,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  }),

  locking: new THREE.MeshStandardMaterial({
    color: 0x7272ff,
    roughness: 0,
    metalness: 1,
    emissive: 0x7272ff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  }),

  equipment: new THREE.MeshStandardMaterial({
    color: 0x444477,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xcccccc,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  }),

  podium: new THREE.MeshStandardMaterial({
    color: 'aquamarine',
    roughness: 0.6,
    metalness: 0.02,
    emissive: 'aquamarine',
    emissiveIntensity: 0.4,
    opacity: 0.75,
    transparent: false,
    side: THREE.DoubleSide,
  }),

  parking: new THREE.MeshStandardMaterial({
    color: 'grey',
    roughness: 0.6,
    metalness: 0.02,
    emissive: 'grey',
    emissiveIntensity: 0.4,
    opacity: 0.75,
    transparent: false,
    side: THREE.DoubleSide,
  }),

  generic: new THREE.MeshStandardMaterial({
    color: 0xb6f4fc,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.35,
    transparent: false,
    side: THREE.DoubleSide,
  }),

  lobby: new THREE.MeshStandardMaterial({
    color: 0xb6f4fc,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.35,
    transparent: false,
    side: THREE.DoubleSide,
  }),

  residential: new THREE.MeshStandardMaterial({
    color: 0x264653,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),

  hotel: new THREE.MeshStandardMaterial({
    color: 0xb24ac7,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),

  commercial: new THREE.MeshStandardMaterial({
    color: 0x2a9d8f,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),

  office: new THREE.MeshStandardMaterial({
    color: 0xe9c46a,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),

  leisure: new THREE.MeshStandardMaterial({
    color: 0xf4a261,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),

  healthcare: new THREE.MeshStandardMaterial({
    color: 0xe76f51,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  education: new THREE.MeshStandardMaterial({
    color: 0xe76f51,
    roughness: 0.6,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0.4,
    opacity: 0.55,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
};

// NO TRANSPARENCY

export const treeMats = [
  new THREE.MeshStandardMaterial({
    color: 0x216c5b,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x216c5b,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x6ba249,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x6ba249,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x073828,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x073828,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x098b66,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x098b66,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x4d774c,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x4d774c,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }),
];

// this should be in another file, what is appropriate

var getStuffDashCircle2 = function (pos) {
  var segment = 25,
    radius = 25;
  var lineGeometry = new Geometry();
  var vertArray = lineGeometry.vertices;
  var angle = (2 * Math.PI) / segment;
  for (var i = 0; i < segment; i++) {
    var x = radius * Math.cos(angle * i);
    var y = radius * Math.sin(angle * i);
    vertArray.push(new THREE.Vector3(x, y, 0));
  }
  lineGeometry.computeLineDistances();
  const lineMat = new THREE.LineDashedMaterial({
    color: 0x000000,
    dashSize: 4,
    gapSize: 2,
  });
  var circle = new THREE.Line(lineGeometry, lineMat);
  circle.rotation.x = Math.PI / 2;
  circle.position.x = pos.x;
  circle.position.y = pos.y;
  circle.position.z = pos.z;
  return circle;
};

function setOutlineMesh(geometry) {
  var material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    transparent: !0,
    opacity: 0.25,
  });

  material.side = THREE.DoubleSide;
  var verts = geometry.vertices;
  var outline = new Geometry();
  outline.vertices.push(verts[0]);
  outline.vertices.push(verts[1]);
  outline.vertices.push(verts[3]);
  outline.vertices.push(verts[2]);
  outline.vertices.push(verts[0]);
  var mesh = utils2D.setMeshLine(outline);

  return mesh;
}

export const rayMaterial = new THREE.LineDashedMaterial({
  color: 0xffffff,
  transparent: !0,
  opacity: 0.1,
  linewidth: 1,
  scale: 3,
  dashSize: 3,
  gapSize: 1,
});

const waterMat = new THREE.MeshPhongMaterial({
  color: 0x39abb5,
  transparent: !0,
  opacity: 0.25,
});
waterMat.side = THREE.DoubleSide;

const landmarkMat = new THREE.MeshPhongMaterial({
  color: 0xe32551,
});

const contextBuildingMat = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  transparent: !1,
  opacity: 1,
});

contextBuildingMat.side = THREE.DoubleSide;

export const contextBuildingLineMat = new THREE.LineBasicMaterial({
  color: 0x333333,
});

export const contextBuildingMat_v2 = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.6,
  metalness: 0.02,
  emissive: 0xffffff,
  emissiveIntensity: 0.2,
});

contextBuildingMat_v2.side = THREE.DoubleSide;

waterwayMaterial.side = THREE.DoubleSide;

const plainContextMat = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  side: THREE.BackSide,
});
plainContextMat.side = THREE.DoubleSide;

const nodeMaterial = new THREE.MeshPhongMaterial({
  color: 0xe32551,
});
nodeMaterial.side = THREE.DoubleSide;

const indigoMat = new THREE.MeshPhongMaterial({
  color: 0x01091f,
  side: THREE.DoubleSide,
});

const nodeMaterialSelected = new THREE.MeshPhongMaterial({
  color: SwatchGreen,
});

const contextMaterial = new THREE.MeshPhongMaterial({
  color: SwatchGreen,
  transparent: !0,
  opacity: 0.5,
});
contextMaterial.side = THREE.DoubleSide;

const locationMaterial = new THREE.MeshPhongMaterial({
  color: 0xf07c19,
});
locationMaterial.side = THREE.DoubleSide;

const debugMat = new THREE.MeshPhongMaterial({
  color: SwatchGold,
});

const boundingBoxMaterial = new THREE.MeshPhongMaterial({
  color: SwatchGreen,
  transparent: !0,
  opacity: 0.9,
  morphTargets: !0,
});
boundingBoxMaterial.side = THREE.DoubleSide;

const plus_spriteMap = new THREE.TextureLoader().load('/images/sprites/dot_sprite_white.png');

export const plus_spriteMaterial = new THREE.SpriteMaterial({
  map: plus_spriteMap,
  color: 0xff7272,
  // sizeAttenuation: true,
  size: 240,
  depthWrite: true,
});

const heatmap_spriteMaterial = new THREE.SpriteMaterial({
  map: plus_spriteMap,
  color: 0xffffff,
  sizeAttenuation: true,
  size: 100,
  depthWrite: true,
});

export const lineMat_slab = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 5,
});

export const lineMat_prog = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 5,
});

export const slabMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0,
  metalness: 1,
  emissive: 0x000000,
  emissiveIntensity: 0.02,
  transparent: false,
  depthWrite: false,
});

slabMat.side = THREE.DoubleSide;

export const plotMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.4,
  metalness: 0.1,
  emissive: 0xffffff,
  emissiveIntensity: 0.2,
  transparent: true,
  opacity: 0.5,
});

plotMat.side = THREE.DoubleSide;

export const peopleMats = [];

for (let i = 0; i < 14; i++) {
  let map = new THREE.TextureLoader().load(`/images/people/${i + 1}.png`);
  const personMat = new THREE.MeshBasicMaterial({ map });
  personMat.map.needsUpdate = true;
  personMat.side = THREE.DoubleSide;
  personMat.transparent = true;
  personMat.opacity = 0.8;
  personMat.depthWrite = false;
  peopleMats.push(personMat);
}

const contextTerrainLineMat = new THREE.LineBasicMaterial({
  color: 0xe0ab8b,
});

const contextTerrainMat = new THREE.MeshStandardMaterial({
  color: 0xc68863,
  roughness: 0.6,
  metalness: 0.02,
  emissive: 0xc68863,
  emissiveIntensity: 0.2,
});

// contextTerrainMat.opacity = 0.5
contextTerrainMat.transparent = true;

const contextTerrainMatObj = {
  n: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_nw.png'),
  }),

  s: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_nw.png'),
  }),

  e: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_nw.png'),
  }),

  w: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_nw.png'),
  }),

  center: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_nw.png'),
  }),

  nw: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_nw.png'),
  }),
  ne: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_ne.png'),
  }),
  sw: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_sw.png'),
  }),
  se: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.02,
    // emissive: 0Xffffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
    // depthWrite: false,
    alphaMap: new THREE.TextureLoader().load('/images/ui/quadMap_se.png'),
  }),
};

const dot_sprite = new THREE.TextureLoader().load('/images/sprites/dot_sprite.png');

const dotMat_blue = new THREE.PointsMaterial({
  color: 0x26a1ff,
  map: dot_sprite,
  transparent: false,
  opacity: 0.75,
  size: 1,
});

const dotMat_orange = new THREE.PointsMaterial({
  color: 0xff8a0d,
  map: dot_sprite,
  transparent: false,
  opacity: 0.75,
  size: 1,
});

export const treeMat = new THREE.MeshStandardMaterial({
  color: 0x34c6f5,
  roughness: 0.8,
  metalness: 0.2,

  // emissive: 0x00DDAA,
  // emissiveIntensity: 0.5
});

export const arrowMat = new THREE.MeshStandardMaterial({
  color: 0x34c6f5,
  opacity: 0.75,
  transparent: true,
  emissive: 0x00ddaa,
  emissiveIntensity: 0.1,
});

export const compassMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  opacity: 0.75,
  transparent: false,
  emissive: 0xffffff,
  emissiveIntensity: 0.1,
});

export const duckMat = new THREE.MeshStandardMaterial({
  color: 0xffd800,
  opacity: 1,
  transparent: false,
  emissive: 0xffd800,
  emissiveIntensity: 0.1,
});

export const dotMat_sunPos = new THREE.PointsMaterial({
  color: 0xff7c00,
  map: dot_sprite,
  transparent: true,
  opacity: 0.75,
  size: 10,
});

const selectedBlockMat = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.1,
  metalness: 0.8,
  emissive: 0xff0000,
  emissiveIntensity: 0.5,
});

/*var envelopMat = new THREE.MeshStandardMaterial({

    color: 0x34c6f5,
    roughness: 0.2,
    metalness: 0.4,
    emissive: 0x34c6f5,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.7,
    // depthWrite: false

})*/

/*var envelopIntMat = new THREE.MeshStandardMaterial({

    color: 0xff3300,
    roughness: 0.2,
    metalness: 0.4,
    emissive: 0xff0000,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.25,
    // depthWrite: false

})

envelopMat.side = THREE.DoubleSide
// envelopMat.side = THREE.BackSide

envelopIntMat.side = THREE.DoubleSide*/

/*var exceedsMat = new THREE.MeshStandardMaterial({

    color: 0xff0000,
    roughness: 0.6,
    metalness: 0.3,
    emissive: 0xff0000,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.5,

})*/

export const constraintsMat = new THREE.MeshStandardMaterial({
  color: 0x0096ff,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});

export const defaultLineMaterial = new THREE.LineBasicMaterial({
  color: 'white',
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round',
});

export const slabEdgeMat = new THREE.LineBasicMaterial({
  color: 'white',
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round',
  transparent: true,
  opacity: 0,
});

const sunPathMat = new MeshLineMaterial({
  color: 'salmon',
  lineWidth: 0.003,
  transparent: true,
  opacity: 0.5,
  sizeAttenuation: false,
});

/*const borderMat = new MeshLineMaterial({
    color: 0x222222,
    lineWidth: .003,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: false
})*/

//Cache used for bloomPass:
const darkMaterial = new THREE.MeshBasicMaterial({
  color: 'black',
});

export const materialCache = {};

const riverLineMat = new THREE.LineBasicMaterial({
  color: 0x39abb5,
  transparent: !0,
  opacity: 0.5,
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round',
});

export const cameraMat = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 0.4,
  metalness: 0.1,
  emissive: 0x333333,
  emissiveIntensity: 0.25,
  transparent: true,
  opacity: 0.6,
});

const optimizeMat = new THREE.MeshPhongMaterial({
  color: 0xf54e42,
  emissive: 0xf54e42,
  emissiveIntensity: 0.4,
  side: THREE.DoubleSide,
});

const bidenMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.8,
  side: THREE.DoubleSide,
});

const trumpMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.8,
  side: THREE.DoubleSide,
});

export const geojsonColors = {
  residential: 'rgb(38, 70, 83)',
  commercial: 'rgb(42, 157, 143)',
  office: 'rgb(233, 196, 106)',
  leisure: 'rgb(244, 162, 97)',
  education: 'rgb(231, 111, 81)',
  generic: 'rgb(182, 244, 252)',
  parking: 'rgb(190, 190, 190)',
};

export const programHexColors = {
  residential: '#264653',
  commercial: '#2A9D8F',
  office: '#E9C46A',
  leisure: '#F4A261',
  education: '#E76F51',
  generic: '#b6f4fc',
  parking: 'grey',
};
