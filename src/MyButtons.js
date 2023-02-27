import React from "react";
import { render } from "react-dom";
import { myGenerateAll } from "./api";

import {Canvas} from "./Canvas";

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { message: "Generate new masterplan" };
  }

  handleClick(e) {
    myGenerateAll();
    this.setState({ message: "Generate new masterplan" });
  }

  render() {
    return (
      <button onClick={this.handleClick.bind(this)}>
        {this.state.message}
      </button>
    );
  }
}

class RefreshButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { message: "Refresh 3D" };
  }

  async handleClick(e) {
    // Get a reference to the Canvas component
    const canvas = new Canvas();
    // Call the hello() function on the Canvas component
    canvas.hello();
    let jsonPackage = await myGenerateAll();
    console.log("RefreshButton jsonPackage = ",jsonPackage);
    canvas.refresh(jsonPackage);
    this.setState({ message: "Refresh 3D" });
  }
// This function gets a reference to the Canvas component 
// using a ref, then calls the hello() function on it.

  render() {
    return (
    <div>
      <button onClick={this.handleClick.bind(this)}>
        {this.state.message}
      </button>
      <Canvas ref={this.canvasRef} />        
    </div>
    );
  }
}

export default LikeButton;
export { RefreshButton };
