import React from "react";
import * as THREE from "three";
import { drawStar, drawCurve, drawCircle, drawBoundary } from "./rendererApi";



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
    console.log("Triggering gridField");
    drawStar(200,200,100);
  }

  radialField() {
    console.log("Triggering radialField");
    drawStar(200,200,100);
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
        <button onClick={this.star.bind(this)}>gridField</button>
        <button onClick={this.star.bind(this)}>radialField</button>

      </div>
    );
  }
}
