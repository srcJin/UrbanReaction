import { myGenerator } from "./generator/main";
import Vector from "./generator/vector";

// make jsonPackage a global variable
export let jsonPackage = {};

console.log("api.ts is running");
export function sayHello() {
  console.log("calling api.ts sayHello()!");
}
export function myReset() {
  myGenerator.tensorField.reset();
}
export function myAddRadial(centre, size, decay) {
  myGenerator.tensorField.addRadial(centre, size, decay);
}
export function myAddGrid(centre, size, decay, theta) {
  myGenerator.tensorField.addGrid(centre, size, decay, theta);
}
export function myRemoveLastField() {
  // console.log("myGenerator.tensorFieldBeforeRemove", myGenerator.tensorField);
  myGenerator.tensorField.removeField(
    myGenerator.tensorField.basisFields[
      myGenerator.tensorField.basisFields.length - 1
    ]
  );
  // console.log("myGenerator.tensorFieldAfterRemove", myGenerator.tensorField);
}
// add to export json
function exportToJsonFile(jsonData, filename) {
  const dataStr = JSON.stringify(jsonData);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = filename + ".json";
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

export async function myGenerateAll() {
  myGenerator.mySetFirstGenerateFalse();
  const results = await myGenerator.myGenerate();
  // console.log("results=", results);
  const coastline = results.coastline;
  const seaPolygon = results.seaPolygon;
  const river = results.river;
  const secondaryRiver = results.secondaryRiver;
  const majorRoads = results.majorRoads;
  const mainRoads = results.mainRoads;
  const minorRoads = results.minorRoads;
  const bigParks = results.bigParks;
  const smallParks = results.smallParks;
  const intersections = results.intersections;
  const blocks = results.blocks;
  // jsonPackage = {
  //     coastline: coastline,
  //     seaPolygon: seaPolygon,
  //     river: river,
  //     secondaryRiver: secondaryRiver,
  //     majorRoads: majorRoads,
  //     mainRoads: mainRoads,
  //     minorRoads: minorRoads,
  //     bigParks: bigParks,
  //     smallParks: smallParks,
  //     intersections: intersections,
  //     blocks: blocks
  // };

  // cleanup jsonPackage
  for (let key in jsonPackage) {
    jsonPackage[key] = [];
  }

  jsonPackage["coastline"] = [coastline]; // coastline here is only an array, so need to put inside an array to read normally
  jsonPackage["seaPolygon"] = [seaPolygon]; // seaPolygon here is only an array, so need to put inside an array to read normally
  jsonPackage["river"] = [river]; // river here is only an array, so need to put inside an array to read normally
  jsonPackage["secondaryRiver"] = secondaryRiver;
  jsonPackage["majorRoads"] = majorRoads;
  jsonPackage["mainRoads"] = mainRoads;
  jsonPackage["minorRoads"] = minorRoads;
  jsonPackage["bigParks"] = bigParks;
  jsonPackage["smallParks"] = smallParks;
  jsonPackage["intersections"] = intersections;
  jsonPackage["blocks"] = blocks;
  console.log("myGenerateAll jsonPackage=", jsonPackage);
  // save to package.json
  // exportToJsonFile([jsonPackage], "jsonPackage");
  return jsonPackage;
  // generate inside this function
}

export function testAPI() {
  setTimeout(() => {
    console.log("myAddRadial");
    myAddRadial(new Vector(400, 400), 400, 10);
  }, 2000);
  setTimeout(() => {
    console.log("myAddGrid");
    myAddGrid(new Vector(800, 800), 100, 1, 0.5);
  }, 3000);
  setTimeout(() => {
    console.log("myAddRadial2");
    myAddRadial(new Vector(600, 300), 300, 8);
  }, 4000);
  // doesn't work for now
  setTimeout(() => {
    console.log("myRemoveLastField");
    myRemoveLastField();
  }, 5000);
}

export function exportJsonDelayed() {
  setTimeout(() => {
    console.log("myGenerateAll");
    let generate = myGenerateAll();
    // clear jsonPackage
    for (let key in jsonPackage) {
      console.log("key=", key);
      jsonPackage[key] = [];
      jsonPackage[key] = generate[key];
    }

    exportToJsonFile([jsonPackage], "jsonPackage");
  }, 2000);
}
