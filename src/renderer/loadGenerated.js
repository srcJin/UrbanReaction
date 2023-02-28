import * as THREE from "three";
import { materialPink, buildingMaterial, waterMaterial } from "./Materials.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import axios from "axios";
import { readNearbyPoints } from "./UrbanLayer.js";
import { setMesh, getPolyline } from "./getGeometries";
// import blocks from "./blocks.json";

async function loadJSON(name) {
  // const promisedObject = fetch("./generated/"+ name +".json")
  // const promisedObject = fetch("./blocks.json")
  // .then((response) => response.json())
  // .then((data) => {return data;});
  // axios({
  //     method: "GET",
  //     url: "./generated/blocks.json",
  //   }).then(function (response) {
  //     console.log(response.data)
  //   });
  // axios.get("./blocks.json").then(response => {
  //     console.log(response.data);
  // }).catch(error=> {
  //     console.log(error);
  // })
  // console.log("loadJson=",{name:name, promisedObject:promisedObject})
  // return {name:name, promisedObject:promisedObject}
}

function usingJSON(object) {
  object.promisedObject.then((data) => {
    console.log(object.name + " = ", data);
  });
}

function convertGeneratedPointListToThreeVectorList(list, scale = 1) {
  let threePointList = [];
  for (let i = 0; i < list.length; i++) {
    let newCurvePoints = [];
    for (let j = 0; j < list[i].length; j++) {
      newCurvePoints.push(
        // here 2000 is an offset value
        new THREE.Vector3(
          list[i][j].x * scale - 2000,
          0,
          list[i][j].y * scale - 2000
        )
      );
    }
    threePointList.push(newCurvePoints);
  }
  //console.log("resultList=", threePointList)
  return threePointList;
}

export function convertJSONToPolyline(
  object,
  material = new LineMaterial({
    color: 0xff0000,
    linewidth: 5, // in pixels
    resolution: 1, // set the resolution of the derivative in pixels
    dashed: false,
  }),
  scale = 4
) {
  // console.log("object=",object);

  let threeGeometry = convertGeneratedPointListToThreeVectorList(object, scale);
  // console.log("threeGeometry=",threeGeometry);
  let group = new THREE.Group();
  for (let line of threeGeometry) {
    // console.log(line);
    group.add(getPolyline(line, false, material));
  }
  return group;
}

export function convertJSONToMeshes(object, isBuilding = false, material, scale = 4 ) {
  let blocksThree = convertGeneratedPointListToThreeVectorList(object, scale);
  readNearbyPoints(blocksThree, 300);
  let output = redrawGeneratedMeshes(blocksThree, isBuilding, material);
  return output;
}

function redrawGeneratedMeshes(blocksThree, isBuilding, material) {
  //console.log("------------------------------------")
  //console.log("redrawBuildings!!!!!!!!!!!!!")

  let sumwSize = 0;
  let avgwSize = 0;
  let group = new THREE.Group();
  for (let i = 0; i < blocksThree.length; i++) {
    if (isBuilding) {
      // read weight
      sumwSize = 0;
      avgwSize = 0;
      //console.log("clipperBuilding[j].nearbyPoints.length=",clipperBuilding[j].nearbyPoints.length)
      // console.log("clipperBuilding[j].nearbyPoints[1].wSize",clipperBuilding[j].nearbyPoints[1].wSize)
      for (let j = 0; j < blocksThree[i].nearbyPoints.length; j++) {
        //console.log(`clipperBuilding[${i}].nearbyPoints[${j}].wSize=${clipperBuilding[i].nearbyPoints[j].wSize}`)
        // sumwSize = sumwSize + blocksThree[i].nearbyPoints[j].wSize
        sumwSize = 100;
      }
      // avgwSize=sumwSize/blocksThree[i].nearbyPoints.length
      //console.log("redrawBuildings, avgwSize= ",avgwSize)
      group.add(setMesh(blocksThree[i], 40, material));
    } else {
      group.add(setMesh(blocksThree[i], 1, material));
    }
  }
  // console.log("group=",group);
  return group;
}
// redrawGeneratedContext(blocksThree)

function redrawGeneratedContext(blocksThree) {
  for (let i = 0; i < blocksThree.length; i++) {
    setMesh(
      blocksThree[i],
      40,
      new THREE.MeshPhongMaterial({
        color: 0x636363,
        transparent: false,
        opacity: 1,
      })
    );
  }

  //console.log("clipper.split_polygon(pList,ptl)=",clipperBlocks)
  for (let j = 0; j < blocksThree.length; j++) {
    setMesh(
      blocksThree[j],
      40,
      new THREE.MeshPhongMaterial({
        color: 0xa9a9a9,
        transparent: false,
        opacity: 1,
      })
    );
  }
}

let scale = 4;
