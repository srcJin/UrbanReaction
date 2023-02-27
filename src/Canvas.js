import React, { useRef } from "react";
import "./Buttons.css";
import { myGenerateAll } from "./api";
import { myGenerator } from "./main";
import { renderer, animate, scene } from "./renderer";
import { convertJSONToMeshes,convertJSONToPolyline } from "./renderer/loadGenerated.js";
import { buildingMaterial, coastlineMaterial, greenMaterial, majorRoadMaterial, minorRoadMaterial, waterMaterial } from "./renderer/Materials.js"
import { jsonPackage } from "./api";
export class Canvas extends React.Component {

  hello() {
    console.log("hello from canvas!")
  }
  
  async refresh(jsonPackage) {
    console.log("refreshing 3d")
    // remove meshes from scene, keep lights
    for (let i = scene.children.length - 1; i >= 0; i--) {
      // console.log(scene);
      if(scene.children[i].type === ("Group" || "Line2" || "Points"|| "Points" || "Mesh"))
          scene.remove(scene.children[i]);
  }
    console.log("Canvas refresh jsonPackage = ", jsonPackage);
    scene.add(convertJSONToMeshes(jsonPackage.blocks, true, buildingMaterial ));
    scene.add(convertJSONToMeshes(jsonPackage.seaPolygon, false, waterMaterial  ));
    scene.add(convertJSONToMeshes(jsonPackage.river, false, waterMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.bigParks, false, greenMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.smallParks, false, greenMaterial));

    scene.add(convertJSONToPolyline(jsonPackage.majorRoads, majorRoadMaterial))
    scene.add(convertJSONToPolyline(jsonPackage.minorRoads, minorRoadMaterial))
    scene.add(convertJSONToPolyline(jsonPackage.mainRoads, majorRoadMaterial))
    scene.add(convertJSONToPolyline(jsonPackage.coastline, coastlineMaterial)) 

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
    console.log("jsonPackage=", jsonPackage);
    let generate = await myGenerateAll()
    
    // clear jsonPackage

    for (let key in jsonPackage) {
      console.log("key=",key);
      jsonPackage[key] = []
      jsonPackage[key] = generate[key]
    }

    // exportJsonDelayed();
    scene.add(convertJSONToMeshes(jsonPackage.blocks, true, buildingMaterial ));
    scene.add(convertJSONToMeshes(jsonPackage.seaPolygon, false, waterMaterial  ));
    scene.add(convertJSONToMeshes(jsonPackage.river, false, waterMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.bigParks, false, greenMaterial));
    scene.add(convertJSONToMeshes(jsonPackage.smallParks, false, greenMaterial));

    scene.add(convertJSONToPolyline(jsonPackage.majorRoads, majorRoadMaterial))
    scene.add(convertJSONToPolyline(jsonPackage.minorRoads, minorRoadMaterial))
    scene.add(convertJSONToPolyline(jsonPackage.mainRoads, majorRoadMaterial))
    scene.add(convertJSONToPolyline(jsonPackage.coastline, coastlineMaterial)) 


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





