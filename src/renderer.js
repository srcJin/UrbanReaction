import * as THREE from "three";
import React, { Component } from "react";
import "./Buttons.css";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import * as GeometryUtils from "three/addons/utils/GeometryUtils.js";
import { weightGrid } from "./renderer/UrbanLayer.js";

import {
    getCurve,
    getCircle,
    getStar,
    getPoint,
    getBoundary,
    getLine,
    getWeightGrid,
    getGrids,
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
