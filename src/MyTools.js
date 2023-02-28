import React from "react";
import * as THREE from "three";
import { drawStar, drawCurve, drawCircle, drawBoundary,drawRectangle } from "./rendererApi";
import { myAddGrid,myAddRadial,myReset } from "./generatorApi";
import Vector from "./ts/vector";
import { randInt } from "three/src/math/MathUtils";
import { Canvas } from "./Generator";
import { myGenerateAll } from "./generatorApi";
import { jsonPackage } from "./generatorApi";

export class NumberInputs extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    this.state = { message: "Generate new masterplan", result: 0 };
  }

  update() {
    console.log("Triggering update");
    const input1 = this.inputRef1.current.value;
    const input2 = this.inputRef2.current.value;
    const sum = parseInt(input1, 10) + parseInt(input2, 10);
    this.setState({ result: sum });
  }

  render() {
    return (
      <div className="NumberInputs">
        <input
          pattern="[0-9]"
          ref={this.inputRef}
          type="number"
          placeholder="number input 1"
        />
        <input
          pattern="[0-9]"
          ref={this.inputRef}
          type="number"
          placeholder="number input 2"
        />

        <button onClick={this.update.bind(this)}>updates</button>
        <p>Result: {this.state.result}</p>
      </div>
    );
  }
}

export class ToolButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = { message: "Tools" };
  }

  pencil() {
    console.log("Triggering pencil");
  }
  eraser() {
    console.log("Triggering eraser");
  }
  axis() {
    console.log("Triggering axis");
  }

  boundary() {
    console.log("Triggering boundary");
    drawBoundary(4000,3000)
  }
  
  curve() {
    let controlPoints = [
        new THREE.Vector3(-800, 0, 0),
        new THREE.Vector3(-200, 0, 200),
        new THREE.Vector3(200, 0, -200),
        new THREE.Vector3(800, 0, 0),
      ];

    drawCurve(controlPoints)
    console.log("Triggering curve");
  }

  circle() {
    console.log("Triggering circle");
    drawCircle(400,300,200);
  }

  star() {
    console.log("Triggering star");
    drawStar(0,200,100);
  }

  gridField() {
    let positx = 300
    let posity = 400

    console.log("Triggering gridField");
    myAddGrid(new Vector(positx, posity), randInt(50,100), 1, 0.5);
    // divide by scale (now is 4). offset by 2000, move to left corner
    drawRectangle(positx-1200,posity-1200,200,200);
  }

  radialField() {
    let positx = 200
    let posity = 100
    console.log("Triggering radialField");
    myAddRadial(new Vector(200, 100), randInt(50,100), 8);  
    drawCircle(positx-1200,posity-1200,100);
  }

  resetField() {
    console.log("Triggering resetField");
    myReset()
    const canvas = new Canvas();
    canvas.emptyScene()
  }

  generate() {

    myGenerateAll();

  }

  update3D() {
    const canvas = new Canvas();
    console.log("RefreshButton jsonPackage = ",jsonPackage);
    canvas.refresh(jsonPackage);

  } 



  render() {
    return (
      <div className="Tools">
        <button onClick={this.pencil.bind(this)}>pencil</button>
        <button onClick={this.eraser.bind(this)}>eraser</button>
        <button onClick={this.boundary.bind(this)}>boundary</button>
        <button onClick={this.axis.bind(this)}>axis</button>
        <button onClick={this.curve.bind(this)}>curve</button>
        <button onClick={this.circle.bind(this)}>circle</button>
        <button onClick={this.star.bind(this)}>star</button>
        <br></br>
        <br></br>
        <button onClick={this.resetField.bind(this)}>resetField</button>
        <button onClick={this.gridField.bind(this)}>gridField</button>
        <button onClick={this.radialField.bind(this)}>radialField</button>
        <button onClick={this.generate.bind(this)}>Generate</button>
        <button onClick={this.update3D.bind(this)}>Update3D</button>
      </div>
    );
  }
}
