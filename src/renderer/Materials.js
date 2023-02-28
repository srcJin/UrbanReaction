import * as THREE from 'three';
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

var lineMaterial = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 10,
})


var highlightLine = new THREE.LineBasicMaterial({
  color: 0x0000FF,
  linewidth: 30,
})


var SwatchBlue    =   0x029DAF
var SwatchOrange   =   0xF07C19
var SwatchYellow  =   0xFFC219
var SwatchPink    =   0xE42251
var SwatchGreen   =   0xE5D599
var SwatchGold    =   0x118AB2

// Colors for Programs
var pGreen = '#2FC2A1'
var pYellow = '#F8EE84'
var pOrange = '#F8EE84'
var pPink = '#CE3049'
var pGrey = '#888888'
var indego = '#01091F'



export var bluePaint = new THREE.MeshPhongMaterial({
    
  color: SwatchBlue,
  transparent: true,
  opacity: 0.8

})

export let blueLine = new THREE.LineBasicMaterial({

  color: 0x7bcbb4,
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round',
  side: THREE.DoubleSide
})


export let darkBlueLine = new THREE.LineBasicMaterial({

  color: 0x01091F,
  transparent: true,
  opacity: 0.5,
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round'

})

export let DBFMATS = {}

DBFMATS.darkBlueLine = new THREE.LineBasicMaterial({

  color: 0x01091F,
  transparent: true,
  opacity: 0.5,
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round'

})

DBFMATS.darkBlueLine = new THREE.LineBasicMaterial({

  color: 0x01091F,
  transparent: true,
  opacity: 0.5,
  linewidth: 3,
  linecap: 'round',
  linejoin: 'round'

})


DBFMATS.orangePaint = new THREE.MeshPhongMaterial({
    
    color: SwatchOrange,
    transparent: true,
    opacity: 0.25

})

// Jin Added
//If you render in the form of points, you need to set the point corresponding to the material
export var pointMaterialRed = new THREE.PointsMaterial({
  color: 0xE42251,    //Set the color, default 0xFFFFFF
  vertexColors: false, //Define whether the material uses vertex color, the default is false ---If this option is set to true, the color attribute is invalid
  size: 50,          //Define the size of the particles. The default is 1.0
  transparent: true,
  opacity: 1
});
export var pointMaterialGreen = new THREE.PointsMaterial({
  color: 0x008000,    //Set the color, default 0xFFFFFF
  vertexColors: false, //Define whether the material uses vertex color, the default is false ---If this option is set to true, the color attribute is invalid
  size: 50     ,        //Define the size of the particles. The default is 1.0
  transparent: true,
  opacity: 1
});
export var pointMaterialBlue = new THREE.PointsMaterial({
  color: 0x30144255,    //Set the color, default 0xFFFFFF
  vertexColors: false, //Define whether the material uses vertex color, the default is false ---If this option is set to true, the color attribute is invalid
  size: 50    ,         //Define the size of the particles. The default is 1.0
  transparent: true,
  opacity: 1
});
export var pointMaterialPurple = new THREE.PointsMaterial({
  color: 0xAF69EF,    //Set the color, default 0xFFFFFF
  vertexColors: false, //Define whether the material uses vertex color, the default is false ---If this option is set to true, the color attribute is invalid
  size: 50,        //Define the size of the particles. The default is 1.0
  transparent: true,
  opacity: 1.0
});

export const buildingMaterial = 
    new THREE.MeshPhongMaterial({
       color : 0xE1E1E1, 
       transparent: false, 
       opacity: 1 
})

export const greenMaterial = 
    new THREE.MeshPhongMaterial({
       color : 0xbadc6f, 
       transparent: false, 
       opacity: 1 
})

export const waterMaterial = 
    new THREE.MeshPhongMaterial({
       color : 0x89cff0, 
       transparent: false, 
       opacity: 1 
})


export const majorRoadMaterial = new LineMaterial({
  color: 0xffd166,
  linewidth: 5, // in pixels
  resolution: 1, // set the resolution of the derivative in pixels
  dashed: false,
})

export const mainRoadMaterial = new LineMaterial({
  color: 0x118AB2,
  linewidth: 5, // in pixels
  resolution: 1, // set the resolution of the derivative in pixels
  dashed: false,
})

export const minorRoadMaterial = new LineMaterial({
  color: 0xec5f6b,
  linewidth: 5, // in pixels
  resolution: 1, // set the resolution of the derivative in pixels
  dashed: false,
})

export const coastlineMaterial = new LineMaterial({
  color: 0x6bae9c,
  linewidth: 5, // in pixels
  resolution: 1, // set the resolution of the derivative in pixels
  dashed: false,
})


export const mat_4 = new THREE.MeshPhongMaterial({
    color: 0xfc5185,
    transparent: false,
    opacity: 1,
});