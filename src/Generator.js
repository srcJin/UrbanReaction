import React, { useRef } from "react";
import "./Buttons.css";
import { myGenerateAll, jsonPackage } from "./generatorApi";
import { myGenerator } from "./main";
import { renderer, animate, scene } from "./Renderer";
import {
  convertJSONToMeshes,
  convertJSONToPolyline,
  convertJSONToBuildings,
} from "./renderer/loadGenerated.js";
import {
  buildingMaterial,
  coastlineMaterial,
  greenMaterial,
  majorRoadMaterial,
  minorRoadMaterial,
  waterMaterial,
} from "./renderer/Materials.js";
import { weightGrid } from "./renderer/GridEditor";
import { drawWeightGrid } from "./rendererApi";
export class Canvas extends React.Component {
  hello() {
    console.log("hello from canvas!");
  }

  emptyScene() {
    console.log("refreshing 3d");
    // remove meshes from scene, keep lights
    for (let i = 0; i <= scene.children.length - 1; i++) {
      // console.log(scene);
      if (
        scene.children[i].type ===
        ("Group" || "Mesh" || "Line2" || "Points" || "Points")
      ) {
        scene.remove(scene.children[i]);
      }

      if (scene.children[i].type === "Mesh") {
        scene.remove(scene.children[i]);
      }
    }

    console.log("Canvas refresh jsonPackage = ", jsonPackage);
    renderer.setSize(500, 500);
    renderer.setPixelRatio(1);
    console.log(scene);

    animate();
  }

  async refresh(jsonPackage) {
    console.log("refreshing 3d");
    // remove meshes from scene, keep lights
    for (let i = scene.children.length - 1; i >= 0; i--) {
      // console.log(scene);
      if (
        scene.children[i].type ===
        ("Group" || "Line2" || "Points" || "Points" || "Mesh")
      )
        scene.remove(scene.children[i]);
    }
    console.log("Canvas refresh jsonPackage = ", jsonPackage);
    scene.add(
      convertJSONToMeshes(jsonPackage.seaPolygon, waterMaterial)
    );
    scene.add(convertJSONToMeshes(jsonPackage.river, waterMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.bigParks, greenMaterial));
    scene.add(
      convertJSONToMeshes(jsonPackage.smallParks, greenMaterial)
    );

    scene.add(convertJSONToPolyline(jsonPackage.majorRoads, majorRoadMaterial));
    scene.add(convertJSONToPolyline(jsonPackage.minorRoads, minorRoadMaterial));
    scene.add(convertJSONToPolyline(jsonPackage.mainRoads, majorRoadMaterial));
    scene.add(convertJSONToPolyline(jsonPackage.coastline, coastlineMaterial));
    scene.add(
      convertJSONToBuildings(jsonPackage.blocks, buildingMaterial)
    );

    renderer.setSize(500, 500);
    renderer.setPixelRatio(1);
    animate();
  }

  async componentDidMount() {
    //
    // road network generator
    //
    console.log("myGenerator", myGenerator);
    console.log("myGenerator.tensorField", myGenerator.tensorField);
    // running api.js
    // await testAPI()

    // clear jsonPackage
    for (const key in jsonPackage) {
      jsonPackage[key] = [];
    }

    // refresh jsonPackage
    // generate can only run right before jsonPackage, nothing can happen in between
    let generate = await myGenerateAll();
    for (let key in jsonPackage) {
      jsonPackage[key] = []; // add this line to disable, disable for now for tweaking api
      jsonPackage[key] = generate[key];
    }

    // exportJsonDelayed();
    scene.add(
      convertJSONToMeshes(jsonPackage.seaPolygon, waterMaterial)
    );
    scene.add(convertJSONToMeshes(jsonPackage.river, waterMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.bigParks, greenMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.smallParks, greenMaterial));

    scene.add(convertJSONToPolyline(jsonPackage.majorRoads, majorRoadMaterial));
    scene.add(convertJSONToPolyline(jsonPackage.minorRoads, minorRoadMaterial));
    scene.add(convertJSONToPolyline(jsonPackage.mainRoads, majorRoadMaterial));
    scene.add(convertJSONToPolyline(jsonPackage.coastline, coastlineMaterial));
    scene.add(convertJSONToBuildings(jsonPackage.blocks, buildingMaterial, weightGrid));

    //
    // three js renderer
    //
    // here to change the canvas size
    // renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
    renderer.setSize(500, 500);
    // this line causes the bug for ratio, manually set to 1 for now
    // renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setPixelRatio(1);

    // scene.add(convertJSONToMeshes(blocks, true));
    // scene.add(convertJSONToMeshes(seaPolygon, false));
    // scene.add(convertJSONToPolyline(majorRoads,4))
    // scene.add(convertJSONToPolyline(mainRoads,4))
    // use ref as a mount point of the Three.js scene instead of the document.body
    this.mount.appendChild(renderer.domElement);
    animate();
  }

  render() {
    return (
      // mount the canvas inside of React
      // attach the Three.js renderer to the React Element utilizing a ref.
      <div ref={(ref) => (this.mount = ref)} />
    );
  }
}
