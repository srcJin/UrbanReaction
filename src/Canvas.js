import React, { Component } from "react";
import "./Buttons.css";
import { testAPI, exportJsonDelayed, myGenerateAll } from "./api";
import { myGenerator } from "./main";
import { renderer, animate, scene } from "./renderer";
import { convertJSONToMeshes,convertJSONToPolyline } from "./renderer/loadGenerated.js";


class Canvas extends Component {
  async componentDidMount() {

    //
    // road network generator
    // 
    console.log("myGenerator", myGenerator);
    console.log("myGenerator.tensorField", myGenerator.tensorField);
    // running api.js
    // await testAPI()
    let jsonPackage = await myGenerateAll()
    console.log("jsonPackage=", jsonPackage);
    // exportJsonDelayed();
    scene.add(convertJSONToMeshes(jsonPackage.blocks, true));
    scene.add(convertJSONToMeshes(jsonPackage.seaPolygon, false));
    // scene.add(convertJSONToMeshes(jsonPackage.bigParks, false));
    // scene.add(convertJSONToMeshes(jsonPackage.smallParks, false));
    scene.add(convertJSONToPolyline(jsonPackage.majorRoads,4))
    scene.add(convertJSONToPolyline(jsonPackage.mainRoads,4))
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

export default Canvas;



