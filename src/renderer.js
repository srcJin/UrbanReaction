import * as THREE from "three";
import React, { Component } from "react";
import "./Buttons.css";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import * as GeometryUtils from "three/addons/utils/GeometryUtils.js";
import { weightGrid } from "./renderer/UrbanLayer.js";
import blocks from "./renderer/generated/blocks.json";
import majorRoads from "./renderer/generated/majorRoads.json";
import mainRoads from "./renderer/generated/mainRoads.json";
import seaPolygon from "./renderer/generated/seaPolygon.json";
import {
    getCurve,
    getCircle,
    getStar,
    getPoint,
    getBoundary,
    getLine,
    getWeightGrid,
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
    scene.background = new THREE.Color(0xf0f0f0);

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

    // draw weight Grid
    scene.add(getWeightGrid(weightGrid).newGridPoints);
    scene.add(getWeightGrid(weightGrid).newGrid);

    let boundaryHeight = 1000;
    let boundaryWidth = 800;

    scene.add(getBoundary(boundaryHeight, boundaryWidth));

    // draw Road grid, hardcoded
    function drawRoads(boundaryHeight, boundaryWidth) {
      let divisionX = 5;
      let divisionZ = 4;
      let intervalZ = boundaryHeight / divisionZ;
      let intervalX = boundaryWidth / divisionX;

      let gridMaterial = new LineMaterial({ color: 0xaaaaaa, linewidth: 5 });
      gridMaterial.resolution.set(window.innerWidth, window.innerHeight);

      let grid = new THREE.Group();
      for (
        let i = -boundaryWidth / 2 + intervalX;
        i < boundaryWidth / 2;
        i += intervalX
      ) {
        let line = new Line2(new LineGeometry(), gridMaterial);
        line.geometry.setPositions([
          i,
          0,
          -boundaryHeight / 2,
          i,
          0,
          boundaryHeight / 2,
        ]);
        grid.add(line);
      }

      for (
        let j = -boundaryHeight / 2 + intervalZ;
        j < boundaryHeight / 2;
        j += intervalZ
      ) {
        let line = new Line2(new LineGeometry(), gridMaterial);
        line.geometry.setPositions([
          -boundaryWidth / 2,
          0,
          j,
          boundaryWidth / 2,
          0,
          j,
        ]);
        grid.add(line);
      }
      return grid;
    }

    scene.add(drawRoads(boundaryWidth, boundaryHeight));

    // draw Attractor Curves
    let controlPoints = [
      new THREE.Vector3(-800, 0, 0),
      new THREE.Vector3(-200, 0, 200),
      new THREE.Vector3(200, 0, -200),
      new THREE.Vector3(800, 0, 0),
    ];
    scene.add(getCurve(controlPoints));
    // draw Attractors
    scene.add(getStar(100, 200, 100));
    scene.add(getCircle(-200, -200, 80));

    // clipper to get parcles

    // extrude meshes
    // scene.add(convertJSONToMeshes(blocks, true));
    // scene.add(convertJSONToMeshes(seaPolygon, false));

    // scene.add(convertJSONToPolyline(majorRoads,4))
    // scene.add(convertJSONToPolyline(mainRoads,4))


    // sayHello()
    // visualize weight grids
    // add layer control to the weight grids

    // load generated json
    // initial draw

    // reloadJSON()

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

    //
    // start GUI
    //
    const gui = new GUI();

    gui.add(params, "uniform");
    gui.add(params, "centripetal");
    gui.add(params, "chordal");

    gui.close();

    // because have animate function so works
    // function render() {
    //   renderer.render(scene, camera);
    // }
